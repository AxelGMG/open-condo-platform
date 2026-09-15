const { get } = require('lodash')
const uniq = require('lodash/uniq')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { find } = require('@open-condo/keystone/schema')

const {
    checkPermissionsInEmployedOrRelatedOrganizations,
    getEmployedOrRelatedOrganizationsByPermissions,
} = require('@condo/domains/organization/utils/accessSchema')


async function canReadAssets ({ authentication: { item: user }, context }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isSupport || user.isAdmin) return {}

    const permittedOrganizations = await getEmployedOrRelatedOrganizationsByPermissions(
        context,
        user,
        'canReadAssets'
    )

    return {
        organization: {
            id_in: permittedOrganizations,
        },
    }
}

async function canManageAssets (args) {
    const {
        authentication: { item: user },
        originalInput,
        operation,
        itemId,
        itemIds,
        context,
    } = args

    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    const isBulkRequest = Array.isArray(originalInput)
    let organizationIds
    const assetOrganizationToPropertyObjects = []

    if (operation === 'create') {
        if (isBulkRequest) {
            organizationIds = originalInput.map(
                input => get(input, ['data', 'organization', 'connect', 'id'])
            )

            if (organizationIds.filter(Boolean).length !== originalInput.length) {
                return false
            }

            organizationIds = uniq(organizationIds)

            for (const input of originalInput) {
                const propertyId = get(input, ['data', 'property', 'connect', 'id'])
                const organizationId = get(
                    input,
                    ['data', 'organization', 'connect', 'id']
                )

                if (propertyId) {
                    assetOrganizationToPropertyObjects.push({
                        propertyId,
                        organizationId,
                    })
                }
            }
        } else {
            const organizationId = get(
                originalInput,
                ['organization', 'connect', 'id']
            )

            if (!organizationId) return false

            organizationIds = [organizationId]

            const propertyId = get(
                originalInput,
                ['property', 'connect', 'id']
            )

            if (propertyId) {
                assetOrganizationToPropertyObjects.push({
                    propertyId,
                    organizationId,
                })
            }
        }
    } else if (operation === 'update') {
        const ids = itemIds || [itemId]

        if (ids.length !== uniq(ids).length) return false

        const items = await find('Asset', {
            id_in: ids,
            deletedAt: null,
        })

        if (
            items.length !== ids.length ||
            items.some(item => !item.organization)
        ) {
            return false
        }

        organizationIds = uniq(items.map(item => item.organization))

        if (isBulkRequest) {
            for (const { id, data } of originalInput) {
                const propertyId = get(data, ['property', 'connect', 'id'])
                const assetOrganizationId = items
                    .find(asset => asset.id === id)
                    ?.organization

                if (propertyId) {
                    assetOrganizationToPropertyObjects.push({
                        propertyId,
                        organizationId: assetOrganizationId,
                    })
                }
            }
        } else {
            const propertyId = get(
                originalInput,
                ['property', 'connect', 'id']
            )

            const organizationId = items[0]?.organization

            if (propertyId) {
                assetOrganizationToPropertyObjects.push({
                    propertyId,
                    organizationId,
                })
            }
        }
    }

    // Asset and Property must always belong to the same Organization
    if (assetOrganizationToPropertyObjects.length > 0) {
        const propertyIds = assetOrganizationToPropertyObjects.map(
            ({ propertyId }) => propertyId
        )
        const uniquePropertyIds = uniq(propertyIds)

        const properties = await find('Property', {
            id_in: uniquePropertyIds,
            deletedAt: null,
        })

        // Reject missing or deleted properties
        if (properties.length !== uniquePropertyIds.length) {
            return false
        }

        const propertyOrganizationById = new Map(
            properties.map(property => [
                property.id,
                property.organization,
            ])
        )

        for (const {
            propertyId,
            organizationId,
        } of assetOrganizationToPropertyObjects) {
            if (
                propertyOrganizationById.get(propertyId) !== organizationId
            ) {
                return false
            }
        }
    }

    if (user.isSupport || user.isAdmin) return true

    return await checkPermissionsInEmployedOrRelatedOrganizations(
        context,
        user,
        organizationIds,
        'canManageAssets'
    )
}

module.exports = {
    canReadAssets,
    canManageAssets,
}
