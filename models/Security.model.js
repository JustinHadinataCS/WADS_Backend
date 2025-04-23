import mongoose from "mongoose";
const { Schema } = mongoose;

const SecuritySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, enum: ['authenticator', 'sms', null], default: null },
    lastPasswordChange: { type: Date, default: Date.now },
    passwordStrength: { type: String, enum: ['weak', 'medium', 'strong'], default: 'medium' }
});

const Security = mongoose.model("Security", SecuritySchema);

export default Security;
