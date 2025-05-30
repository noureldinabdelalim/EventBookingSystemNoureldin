const User = require('../models/User')
const Event = require('../models/Event');
// const nodemailer = require('nodemailer');


const getMyUser = async (req, res) => {
    const user = req.user; 
    try {
        const userDetails = await User.findById(user._id)
        res.status(200).json({_id: userDetails._id, name: userDetails.name, email: userDetails.email, phone: userDetails.phone, address: userDetails.address, dob: userDetails.dob, nationalId: userDetails.nationalId});
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
}

const updateUser = async (req, res) => {
    const user = req.user; 
    const { name, email, phone, address, dob, nationalId } = req.body;
    try {
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { name, email, phone, address, dob, nationalId },
            { new: true } 
        );
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user details', error });
    }
};


const bookEvent = async (req, res) => {
    const { id: eventId } = req.params; 

    const user = req.user; 

    try {

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.availableTickets < 1) {
            return res.status(400).json({ error: 'Not enough available tickets' });
        }

        event.availableTickets -= 1;
        await event.save();

        if (!user.bookedEvents) {
            user.bookedEvents = [];
        }
        user.bookedEvents.push( eventId );
        console.log(user.bookedEvents)


        await user.save();

        res.status(200).json({ message: 'Booking successful', event, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to book event' });
    }
};
const getMyBookings = async (req, res) => {
    const user = req.user; 

    try {
        const userWithBookings = await User.findById(user._id).populate('bookedEvents');
        console.log(userWithBookings.bookedEvents)

        
        res.status(200).json(userWithBookings.bookedEvents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

const requestOtp = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        user.newestOTP = otp;
        user.otpExpiry = otpExpiresAt;
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'Gmail',

            auth: {
                user: process.env.EMAIL, 
                pass: process.env.EMAIL_PASSWORD 
            }
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It will expire in 10 minutes.`
        };

        await transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			res.status(500);
			throw new Error(error)
		} else {
			res.status(200).json({ message: "OTP Sent, Please Check Your Email" })
		}
	})


        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};
const cancelBooking = async (req, res) => {
    const { id: eventId } = req.params; 
    const user = req.user; 


    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const eventIndex = user.bookedEvents.indexOf(eventId);
        if (eventIndex === -1) {
            return res.status(400).json({ error: 'Event not found in user bookings' });
        }

        user.bookedEvents.splice(eventIndex, 1);
        console.log(user.bookedEvents)

        await user.save();

        event.availableTickets += 1;
        await event.save();

        res.status(200).json({ message: 'Booking canceled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
};






module.exports = {bookEvent, getMyBookings, cancelBooking, getMyUser, updateUser}

