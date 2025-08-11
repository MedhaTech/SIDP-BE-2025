import { resource } from "../models/resource.model";
import BaseController from "./base.controller";
import { Request, Response, NextFunction } from 'express';
import { notFound, unauthorized } from "boom";
import dispatcher from "../utils/dispatch.util";
import ValidationsHolder from "../validations/validationHolder";
import { resourceSchema, resourceUpdateSchema } from '../validations/resource.validations';
import { S3 } from "aws-sdk";
import fs from 'fs';
import { speeches } from "../configs/speeches.config";
import { HttpsProxyAgent } from "https-proxy-agent";
import path from "path";

export default class ResourceController extends BaseController {

    model = "resource";

    protected initializePath(): void {
        this.path = '/resource';
    }
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(resourceSchema, resourceUpdateSchema);
    }
    protected initializeRoutes(): void {
        this.router.post(`${this.path}/resourceFileUpload`, this.handleAttachment.bind(this));
        super.initializeRoutes();
    }
    //fetching all resource details and single resource by resource_id
    protected async getData(req: Request, res: Response, next: NextFunction) {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'STUDENT' && res.locals.role !== 'MENTOR' && res.locals.role !== 'TEAM' && res.locals.role !== 'STATE') {
            throw unauthorized(speeches.ROLE_ACCES_DECLINE)
        }
        try {

            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            let { role, district, type } = newREQQuery;
            let data: any = {}
            const where: any = {};
            where[`status`] = "ACTIVE";
            if (district !== 'All Districts' && district !== undefined) {
                where[`district`] = district
            }
            if (role !== 'All roles' && role !== undefined) {
                where[`role`] = role;
            }
            const { id } = req.params;
            if (id) {
                const newParamId = await this.authService.decryptGlobal(req.params.id);
                where[`resource_id`] = newParamId;
                data = await this.crudService.findOne(resource, {
                    attributes: [
                        "resource_id",
                        "description",
                        "role",
                        "type",
                        "attachments",
                        "district"
                    ],
                    where: [where],
                    order: [['resource_id', 'DESC']]
                })
            }
            else if (type === 'district') {
                where[`district`] = district
                data = await this.crudService.findAll(resource, {
                    attributes: [
                        "resource_id",
                        "description",
                        "role",
                        "type",
                        "attachments",
                        "district"
                    ],
                    where: [where],
                    order: [['resource_id', 'DESC']]
                })
            }
            else {
                data = await this.crudService.findAll(resource, {
                    attributes: [
                        "resource_id",
                        "description",
                        "role",
                        "type",
                        "attachments",
                        "district"
                    ],
                    where: [where],
                    order: [['resource_id', 'DESC']]
                })
                if (data.length <= 0) {
                    where[`district`] = "All Districts"
                    data = await this.crudService.findAll(resource, {
                        attributes: [
                            "resource_id",
                            "description",
                            "role",
                            "type",
                            "attachments",
                            "district"
                        ],
                        where: [where],
                        order: [['resource_id', 'DESC']]
                    })
                }
            }
            return res.status(200).send(dispatcher(res, data, 'success'));
        } catch (error) {
            next(error);
        }
    }
    //storing files in the s3 bucket
    protected async handleAttachment(req: Request, res: Response, next: NextFunction) {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const rawfiles: any = req.files;
            const files: any = Object.values(rawfiles);
            const allowedTypes = ['image/jpeg', 'image/png', 'application/msword', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(files[0].type)) {
                return res.status(400).send(dispatcher(res, '', 'error', 'This file type not allowed', 400));
            }
            const result = await this.copyAllFiles(req, null, "resources");
            result.attachments = result.attachments.split(",");
            res.status(200).send(dispatcher(res, result));
        } catch (err) {
            next(err)
        }
    }
}