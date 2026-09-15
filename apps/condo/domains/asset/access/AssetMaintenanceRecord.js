const get = require('lodash/get')
const uniq = require('lodash/uniq')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { find } = require('@open-condo/keystone/schema')

const {
    checkPermissionsInEmployedOrRelatedOrganizations,
    getEmployedOrRelatedOrganizationsByPermissions,
} = require('@condo/domains/organization/utils/accessSchema')


async function canReadAssetMaintenanceRecords ({ authentication: { item: user }, context }) {
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

async function canManageAssetMaintenanceRecords (args) {
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
    const recordsToValidate = []

    if (operation === 'create') {
        const inputs = isBulkRequest
            ? originalInput.map(input => input.data)
            : [originalInput]

        for (const data of inputs) {
            const assetId = get(data, ['asset', 'connect', 'id'])

            if (!assetId) return false

            recordsToValidate.push({
                assetId,
                employeeId: get(data, ['employee', 'connect', 'id'], null),
            })
        }
    } else if (operation === 'update') {
        const ids = itemIds || [itemId]

        if (
            ids.some(id => !id) ||
            ids.length !== uniq(ids).length
        ) {
            return false
        }

        const maintenanceRecords = await find('AssetMaintenanceRecord', {
            id_in: ids,
            deletedAt: null,
        })

        if (maintenanceRecords.length !== ids.length) {
            return false
        }

        const recordsById = new Map(
            maintenanceRecords.map(record => [record.id, record])
        )

        const inputs = isBulkRequest
            ? originalInput
            : [{ id: itemId, data: originalInput }]

        for (const input of inputs) {
            const record = recordsById.get(input.id)
            if (!record) return false

            const data = input.data || {}

            if (get(data, ['asset', 'disconnect'])) {
                return false
            }

            const assetId =
                get(data, ['asset', 'connect', 'id']) ||
                record.asset

            if (!assetId) return false

            let employeeId = record.employee || null

            if (get(data, ['employee', 'disconnect'])) {
                employeeId = null
            } else {
                employeeId =
                    get(data, ['employee', 'connect', 'id']) ||
                    employeeId
            }

            recordsToValidate.push({
                assetId,
                employeeId,
            })
        }
    } else {
        return false
    }

    const assetIds = uniq(recordsToValidate.map(record => record.assetId))

    const assets = await find('Asset', {
        id_in: assetIds,
        deletedAt: null,
    })

    if (assets.length !== assetIds.length) {
        return false
    }

    const assetsById = new Map(
        assets.map(asset => [asset.id, asset])
    )

    const employeeIds = uniq(
        recordsToValidate
            .map(record => record.employeeId)
            .filter(Boolean)
    )

    let employeesById = new Map()

    if (employeeIds.length > 0) {
        const employees = await find('OrganizationEmployee', {
            id_in: employeeIds,
            deletedAt: null,
        })

        if (employees.length !== employeeIds.length) {
            return false
        }

        employeesById = new Map(
            employees.map(employee => [employee.id, employee])
        )
    }

    const organizationIds = []

    for (const { assetId, employeeId } of recordsToValidate) {
        const asset = assetsById.get(assetId)
        const assetOrganizationId = get(asset, 'organization')

        if (!assetOrganizationId) return false

        organizationIds.push(assetOrganizationId)

        if (employeeId) {
            const employee = employeesById.get(employeeId)
            const employeeOrganizationId = get(employee, 'organization')

            if (
                !employeeOrganizationId ||
                employeeOrganizationId !== assetOrganizationId
            ) {
                return false
            }
        }
    }

    if (user.isSupport || user.isAdmin) return true

    return await checkPermissionsInEmployedOrRelatedOrganizations(
        context,
        user,
        uniq(organizationIds),
        'canRegisterMaintenance'
    )
}

module.exports = {
    canReadAssetMaintenanceRecords,
    canManageAssetMaintenanceRecords,
}
