const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Models
const { User } = require('../models/User.models');
const { Character } = require('../models/Character.models');

// Utils
const { catchAsync } = require('../utils/catchAsync.utils');
const { AppError } = require('../utils/appError.utils');

dotenv.config({ path: './config.env' });

// Gen random jwt signs

const getUserId = catchAsync(async (req, res, next) => {
        const {id} = req.body

	const user = await User.findOne({
		attributes: { exclude: ['password'] },
		where: { status: 'active' },
		include: { model: Character, through: { where: { favorite: true} } },
	});

    if(!user){
        return next(new AppError('User no found', 404))
    }
	res.status(200).json({
		status: 'success',
		data: { user },
	});
});

const createUser = catchAsync(async (req, res, next) => {
	const { name, email, password, birthdate, city, adress } = req.body;

	// Encrypt the password
	const salt = await bcrypt.genSalt(12);
	const hashedPassword = await bcrypt.hash(password, salt);

	const newUser = await User.create({
		name,
		email,
		password: hashedPassword,
		birthdate,
        city,
        adress
	});

	// Remove password from response
	newUser.password = undefined;

	// 201 -> Success and a resource has been created
	res.status(201).json({
		status: 'success',
		data: { newUser },
	});
});

const updateUser = catchAsync(async (req, res, next) => {
	const { name,birthdate,city,adress } = req.body;
	const { user } = req;

	await user.update({ name,birthdate,city,adress });

	res.status(200).json({
		status: 'success',
		data: { user },
	});
});

const deleteUser = catchAsync(async (req, res, next) => {
	const { user } = req;

	await user.update({ status: 'deleted' });

	res.status(204).json({ status: 'success' });
});

const login = catchAsync(async (req, res, next) => {
	// Get email and password from req.body
	const { email, password } = req.body;

	// Validate if the user exist with given email
	const user = await User.findOne({
		where: { email, status: 'active' },
	});

	// Compare passwords (entered password vs db password)
	// If user doesn't exists or passwords doesn't match, send error
	if (!user || !(await bcrypt.compare(password, user.password))) {
		return next(new AppError('Wrong credentials', 400));
	}

	// Remove password from response
	user.password = undefined;

	// Generate JWT (payload, secretOrPrivateKey, options)
	const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
		expiresIn: '30d',
	});

	res.status(200).json({
		status: 'success',
		data: { user, token },
	});
});



module.exports = {
	getUserId,
	createUser,
	updateUser,
	deleteUser,
	login,
};