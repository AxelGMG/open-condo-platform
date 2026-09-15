const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const {
    getEmployedOrRelatedOrganizationsByPermissions,
} = require('@condo/domains/organization/utils/accessSchema')

async function canReadChecklistTaskFiles ({ authentication: { item: user }, context }) {
    if (!user) throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    const permittedOrganizations = await getEmployedOrRelatedOrganizationsByPermissions(context, user, [])

    return {
        organization: {
            id_in: permittedOrganizations,
        },
    }
}

async function canManageChecklistTaskFiles ({ authentication: { item: user } }) {
    if (!user) throwAuthenticationError()
    if (user.deletedAt) return false

    return Boolean(user.isAdmin || user.isSupport)
}

module.exports = {
    canReadChecklistTaskFiles,
    canManageChecklistTaskFiles,
}
