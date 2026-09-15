const { isArray, uniq } = require('lodash')
const get = require('lodash/get')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { find } = require('@open-condo/keystone/schema')

const {
    getEmployedOrRelatedOrganizationsByPermissions,
    checkPermissionsInEmployedOrRelatedOrganizations,
} = require('@condo/domains/organization/utils/accessSchema')
const { RESIDENT } = require('@condo/domains/user/constants/common')

async function canReadSuppliers (args) {
    const { authentication: { item: user }, context } = args

    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return {}

    // Wave 1: comprueba pertenencia a la organización. 
    // En Wave 1.5 se validará el permiso formal canReadSuppliers en OrganizationEmployeeRole.
    const permittedOrganizations = await getEmployedOrRelatedOrganizationsByPermissions(context, user, 'canReadSuppliers')

    return {
        organization: {
            id_in: permittedOrganizations,
        },
    }
}

async function canManageSuppliers (args) {
    const { authentication: { item: user }, originalInput, operation, itemId, itemIds, context } = args

    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true
    if (user.type === RESIDENT) return false

    const isBulkRequest = isArray(originalInput)
    let organizationIds

    if (operation === 'create') {
        if (isBulkRequest) {
            organizationIds = originalInput.map(el => get(el, ['data', 'organization', 'connect', 'id']))
            if (organizationIds.filter(Boolean).length !== originalInput.length) return false
            organizationIds = uniq(organizationIds)
        } else {
            const organizationId = get(originalInput, ['organization', 'connect', 'id'])
            if (!organizationId) return false
            organizationIds = [organizationId]
        }
    } else if (operation === 'update') {
        const ids = itemIds || [itemId]
        if (ids.length !== uniq(ids).length) return false

        const items = await find('Supplier', {
            id_in: ids,
            deletedAt: null,
        })
        if (items.length !== ids.length || items.some(item => !item.organization)) return false
        organizationIds = uniq(items.map(item => item.organization))
    }

    // Wave 1: verifica pertenencia / permiso base.
    // En Wave 1.5 se activará el flag canManageSuppliers en el role.
    return await checkPermissionsInEmployedOrRelatedOrganizations(context, user, organizationIds, 'canManageSuppliers')
}

module.exports = {
    canReadSuppliers,
    canManageSuppliers,
}
