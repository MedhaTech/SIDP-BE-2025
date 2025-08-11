import { popupSchema, popupUpdateSchema } from "../validations/popup.validation";
import ValidationsHolder from "../validations/validationHolder";
import BaseController from "./base.controller";
import { Request, Response, NextFunction } from 'express';
import dispatcher from "../utils/dispatch.util";
import { speeches } from "../configs/speeches.config";
import { unauthorized } from "boom";
import { popup } from "../models/popup.model";

export default class popupController extends BaseController {

    model = "popup";

    protected initializePath(): void {
        this.path = '/popup';
    }
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(popupSchema, popupUpdateSchema);
    }
    protected initializeRoutes(): void {
        this.router.post(`${this.path}/popupFileUpload`, this.handleAttachment.bind(this));
        super.initializeRoutes();
    }

    //storing files in the s3 bucket
    protected async handleAttachment(req: Request, res: Response, next: NextFunction) {
        if (res.locals.role !== 'ADMIN') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }

        try {
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            let type = newREQQuery.type;
            const rawfiles: any = req.files;
            const files: any = Object.values(rawfiles);
            const allowedTypes = type === 'file' ? ['image/jpeg', 'image/png', 'application/msword', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] : ['image/jpeg', 'image/png'];
            if (!allowedTypes.includes(files[0].type)) {
                return res.status(400).send(dispatcher(res, '', 'error', 'This file type not allowed', 400));
            }
            const result = await this.copyAllFiles(req, null, "popups");
            result.attachments = result.attachments.split(",");
            res.status(200).send(dispatcher(res, result));
        } catch (err) {
            next(err)
        }
    }

    //fetching all popup details and single popup by popup_id
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
            let { role, district } = newREQQuery;
            let data: any = {}
            const where: any = {};
            where[`status`] = "ACTIVE";
            if (district !== 'All Districts' && district !== undefined) {
                where[`district`] = district;
            }
            if (role !== 'All roles' && role !== undefined) {
                where[`role`] = role;
            }
            const { id } = req.params;
            if (id) {
                const newParamId = await this.authService.decryptGlobal(req.params.id);
                where[`popup_id`] = newParamId;
                data = await this.crudService.findOne(popup, {
                    where: [where]
                })
            }
            else {
                data = await this.crudService.findAll(popup, {
                    where: [where]
                })
                if (data.length <= 0) {
                    where[`district`] = "All Districts"
                    data = await this.crudService.findAll(popup, {
                        where: [where]
                    })
                }
            }
            return res.status(200).send(dispatcher(res, data, 'success'));
        } catch (error) {
            next(error);
        }
    }
}