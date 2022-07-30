const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const checksSchema = new Schema({
    checkData: {
        type: Schema.Types.Mixed
    },
    checkOutcome:{
        type: Schema.Types.Mixed
    },
    state: {
        type: String,
        enum: ['up', 'down']
    },
    alertWarranted: {
        type: Boolean
    },
    timeofCheck:{
        type: Date
    }
});

const logsSchema = new Schema({
    logId: {
        type: String,
        unique: [true, `Duplicate ID not permitted`]
    },
    logs: [checksSchema]
});

const CheckModel = mongoose.model('checksLog', checksSchema);
const LogsModel = mongoose.model('logs', logsSchema);

module.exports = {CheckModel, LogsModel};