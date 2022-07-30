const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const compressedCheckSchema = new Schema({
    compressedCheck: {
        type: String
    },
});

const compressedLogsSchema = new Schema({
    logId: {
        type: String,
        unique: [true, `Duplicate ID not permitted`]
    },
    compressedLogs: [compressedCheckSchema]
});

//const CompressedCheckModel = mongoose.model('compressedCheck', compressedCheckSchema);
//const CompressedLogModel = mongoose.model('compressedLog', compressedLogsSchema);

//module.exports = {CompressedCheckModel, CompressedLogModel};