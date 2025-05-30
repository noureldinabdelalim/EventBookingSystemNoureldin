const mongoose = require('mongoose')
const Schema = mongoose.Schema
const validator = require('validator')
const bcrypt =  require('bcrypt')
// const { use } = require('react')
const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    nationalId: {
        type: String,
        required: false
    },
    dob: {
        type: Date,
        required: false
    },
    bookedEvents: {
        type: [Schema.Types.ObjectId],
        ref: 'Event',
        default: [],
        required: false
    },
    images: {
        type: [String],
        default: [],
        required: false
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    newestOTP: {
        type: String,
        required: false
    },
    otpExpiry:{
        type: Date
    }
}, { timestamps: true })

userSchema.statics.updatePass = async function(email,password){
    if (!email || !password) {
        console.log('email', email)
        console.log('password', password)
        throw Error('All fields must be filled')
    }

    const user = await this.findOne({ email })
    if (!user) {
        throw Error('Incorrect email')
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password,salt)
    user.password = hash;
    await user.save();
    return {message: 'Updated'}



}
userSchema.statics.addAdmin = async function(name, email, password, phone, address, dob, nationalId) {
    if (!name || !email || !password) {
        throw Error('Name, email, and password are required');
    }

    if (!validator.isEmail(email)) {
        throw Error('Invalid email format');
    }

    const exists = await this.findOne({ email });
    if (exists) {
        throw Error('Email already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const admin = await this.create({
        name,
        email,
        password: hash,
        phone,
        address,
        dob,
        nationalId,
        role: 'admin', 
    });

    return admin;
};

userSchema.statics.register = async function( name,phone, address, dob, nationalId, email,password) {


    if (!name || !email || !password) {
        throw Error('All fields must be filled')
    }

    if(!validator.isEmail(email)){
        throw Error('Email format is wrong')
    }


    




    const exists = await this.findOne({ email })
    if (exists) {
        throw Error('Email already in use')
    }


    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password,salt)

    const user = await this.create({ name,phone, address, dob, nationalId, email, password: hash})

    return user



}
userSchema.statics.login = async function(email, password) {
    if (!email || !password) {
        console.log('email', email)
        console.log('password', password)
        throw Error('All fields must be filled')
    }

    const user = await this.findOne({ email })
    if (!user) {
        throw Error('Incorrect email')
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
        throw Error('Incorrect password')
    }

    return user
}


module.exports = mongoose.model('User', userSchema);
