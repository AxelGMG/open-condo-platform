const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const { PHONE_WRONG_FORMAT_ERROR, EMAIL_WRONG_FORMAT_ERROR } = require('@condo/domains/common/constants/errors')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')
const access = require('@condo/domains/supplier/access/Supplier')
const { SUPPLIER_STATUS_TYPES, SUPPLIER_STATUS_ACTIVE } = require('@condo/domains/supplier/constants/common')

const Supplier = new GQLListSchema('Supplier', {
    schemaDoc: 'Operational catalogue of suppliers providing services or goods to the organization',
    fields: {
        organization: ORGANIZATION_OWNED_FIELD,

        name: {
            schemaDoc: 'Trade name or corporate name of the supplier',
            type: 'Text',
            isRequired: true,
        },

        category: {
            schemaDoc: 'Operational classification of the service or supply provided (e.g. plumbing, security, electrical)',
            type: 'Text',
            isRequired: true,
        },

        contactName: {
            schemaDoc: 'Name of the designated contact person at the supplier company',
            type: 'Text',
            isRequired: false,
        },

        phone: {
            schemaDoc: 'Contact phone number normalized in E.164 format',
            type: 'Text',
            isRequired: false,
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    if (!resolvedData['phone']) return resolvedData['phone']
                    const newValue = normalizePhone(resolvedData['phone'], true)
                    return newValue || resolvedData['phone']
                },
                validateInput: async ({ resolvedData, addFieldValidationError }) => {
                    if (!resolvedData['phone']) return
                    const newValue = normalizePhone(resolvedData['phone'], true)
                    if (newValue !== resolvedData['phone']) {
                        addFieldValidationError(`${PHONE_WRONG_FORMAT_ERROR}phone] invalid format`)
                    }
                },
            },
        },

        email: {
            schemaDoc: 'Contact email address of the supplier',
            type: 'Text',
            isRequired: false,
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    if (!resolvedData['email']) return resolvedData['email']
                    const newValue = normalizeEmail(resolvedData['email'])
                    return newValue || resolvedData['email']
                },
                validateInput: async ({ resolvedData, addFieldValidationError }) => {
                    if (!resolvedData['email']) return
                    const newValue = normalizeEmail(resolvedData['email'])
                    if (newValue !== resolvedData['email']) {
                        addFieldValidationError(`${EMAIL_WRONG_FORMAT_ERROR}email] invalid format`)
                    }
                },
            },
        },

        taxId: {
            schemaDoc: 'Tax identification number (RFC / CIF / Tax ID)',
            type: 'Text',
            isRequired: false,
        },

        status: {
            schemaDoc: 'Operational status of the supplier (active or inactive)',
            type: 'Select',
            options: SUPPLIER_STATUS_TYPES.join(','),
            defaultValue: SUPPLIER_STATUS_ACTIVE,
            isRequired: true,
        },
    },
    plugins: [
        uuided(),
        versioned(),
        tracked(),
        softDeleted(),
        dvAndSender(),
        historical(),
    ],
    access: {
        read: access.canReadSuppliers,
        create: access.canManageSuppliers,
        update: access.canManageSuppliers,
        delete: false,
        auth: true,
    },
})

module.exports = {
    Supplier,
}
