const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { getFileMetaAfterChange } = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema, getById } = require('@open-condo/keystone/schema')

const { addOrganizationFieldPlugin } = require('@condo/domains/organization/schema/plugins/addOrganizationFieldPlugin')
const access = require('@condo/domains/checklist/access/ChecklistTaskFile')

const CHECKLIST_TASK_FILE_FOLDER_NAME = 'checklistTask'
const Adapter = new FileAdapter(CHECKLIST_TASK_FILE_FOLDER_NAME)
const fileMetaAfterChange = getFileMetaAfterChange(Adapter)

const ERRORS = {
    CHECKLIST_TASK_MUST_BELONG_TO_CHECKLIST: {
        code: BAD_USER_INPUT,
        type: 'CHECKLIST_TASK_MUST_BELONG_TO_CHECKLIST',
        message: 'Checklist task must belong to the specified checklist',
    },
}

const ChecklistTaskFile = new GQLListSchema('ChecklistTaskFile', {
    schemaDoc: 'File attached as evidence to a checklist task',
    fields: {
        checklistTask: {
            schemaDoc: 'Checklist task this file belongs to',
            type: 'Relationship',
            ref: 'ChecklistTask',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },

        checklist: {
            schemaDoc: 'Checklist used to determine the organization of the file',
            type: 'Relationship',
            ref: 'Checklist',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },

        file: {
            schemaDoc: 'File object with meta information and publicUrl',
            type: 'File',
            sensitive: true,
            adapter: Adapter,
            isRequired: true,
        },
    },
    hooks: {
        validateInput: async ({ resolvedData, existingItem, context }) => {
            const newItem = { ...existingItem, ...resolvedData }

            if (newItem.checklistTask && newItem.checklist) {
                const checklistTask = await getById('ChecklistTask', newItem.checklistTask)

                if (!checklistTask || checklistTask.checklist !== newItem.checklist) {
                    throw new GQLError(ERRORS.CHECKLIST_TASK_MUST_BELONG_TO_CHECKLIST, context)
                }
            }
        },

        afterChange: fileMetaAfterChange,

        afterDelete: async ({ existingItem }) => {
            if (existingItem.file) {
                await Adapter.delete(existingItem.file)
            }
        },
    },
    plugins: [
        addOrganizationFieldPlugin({ fromField: 'checklist', isRequired: true }),
        uuided(),
        versioned(),
        tracked(),
        softDeleted(),
        dvAndSender(),
        historical(),
        analytical(),
    ],
    access: {
        read: access.canReadChecklistTaskFiles,
        create: access.canManageChecklistTaskFiles,
        update: access.canManageChecklistTaskFiles,
        delete: false,
        auth: true,
    },
})

module.exports = {
    ChecklistTaskFile,
}
