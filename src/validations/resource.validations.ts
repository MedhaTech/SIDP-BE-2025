import Joi from 'joi';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

export const resourceSchema = Joi.object().keys({
    role: Joi.string().required().regex(constents.ALPHA_NUMERIC_PATTERN).messages({
        'string.empty': speeches.ID_REQUIRED
    }),
    type: Joi.string().required().regex(constents.ALPHA_NUMERIC_PATTERN).messages({
        'string.empty': speeches.ID_REQUIRED
    }),
    description: Joi.string().required().messages({
        'string.empty': speeches.ID_REQUIRED
    }),
    attachments: Joi.string().required().messages({
        'string.empty': speeches.ID_REQUIRED
    }),
    district: Joi.string().required().regex(constents.ALPHA_NUMERIC_PATTERN).messages({
        'string.empty': speeches.DISTRICT_REQ
    }),
});

export const resourceUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.common_status_flags.list)).required().messages({
        'any.only': speeches.COMMON_STATUS_INVALID,
        'string.empty': speeches.COMMON_STATUS_REQUIRED
    }),
    role: Joi.string().required().regex(constents.ALPHA_NUMERIC_PATTERN).messages({
        'string.empty': speeches.ID_REQUIRED
    }),
    type: Joi.string().required().regex(constents.ALPHA_NUMERIC_PATTERN).messages({
        'string.empty': speeches.ID_REQUIRED
    }),
    description: Joi.string().required().messages({
        'string.empty': speeches.ID_REQUIRED
    }),
    attachments: Joi.any(),
    district: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN)
});