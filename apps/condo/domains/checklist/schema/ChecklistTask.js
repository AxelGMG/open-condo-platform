const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/checklist/access/ChecklistTask')
const {
    CHECKLIST_STATUSES,
    CHECKLIST_STATUS_PENDING,
} = require('@condo/domains/checklist/constants/common')

const ChecklistTask = new GQLListSchema('ChecklistTask', {
    schemaDoc: 'Operational task that belongs to a scheduled checklist',
    fields: {
        checklist: {
            schemaDoc: 'Checklist this task belongs to',
            type: 'Relationship',
            ref: 'Checklist',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },

        titleSnapshot: {
            schemaDoc: 'Task title stored at the moment the checklist is generated',
            type: 'Text',
            isRequired: true,
        },

        assignedEmployee: {
            schemaDoc: 'Employee assigned to perform this task',
            type: 'Relationship',
            ref: 'OrganizationEmployee',
            isRequired: false,
            knexOptions: { isNotNullable: false },
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },

        status: {
            schemaDoc: 'Current task status',
            type: 'Select',
            options: CHECKLIST_STATUSES,
            defaultValue: CHECKLIST_STATUS_PENDING,
            isRequired: true,
        },

        assignedAt: {
            schemaDoc: 'Date and time when the task was assigned',
            type: 'DateTimeUtc',
            isRequired: false,
        },

        dueAt: {
            schemaDoc: 'Date and time when the task is due',
            type: 'DateTimeUtc',
            isRequired: false,
        },

        completedAt: {
            schemaDoc: 'Date and time when the task was completed',
            type: 'DateTimeUtc',
            isRequired: false,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), analytical()],
    access: {
        read: access.canReadChecklistTasks,
        create: access.canManageChecklistTasks,
        update: access.canManageChecklistTasks,
        delete: false,
        auth: true,
    },
})

module.exports = {
    ChecklistTask,
}
