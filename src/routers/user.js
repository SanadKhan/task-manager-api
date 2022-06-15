const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')
const router = new express.Router()

router.post('/user/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)

        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/user/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send({message: 'Successfully Logged Out!'})
    } catch (e) {
        res.status(500).send(e)
    }
})

router.post('/user/logout-all', auth, async(req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send({ message: 'Logged Out All Sessions!'})
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/users/profile', auth, async(req, res) => {
    res.send(req.user)
})

router.post('/users/create', async (req, res) =>{
    const user =  new User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user.email,user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

router.patch('/user/update', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','email','password','age']
    const isValidOperator = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperator) {
        return res.status(404).send({ error : 'Invalid Updates'})
    }
    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
    
})

router.delete('/user/delete', auth, async (req, res) => {

    try {
        await req.user.remove()
        sendCancellationEmail(re.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})


const upload = multer({
    limits: {   
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Must be jpg, jpeg or png file'))
        }
        cb(undefined, true) 
    }
})

router.post('/user/me/avatar', auth, upload.single('avatar'), async(req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send({ message: 'Sucessfully Updated!'})
}, (error,req, res, next) => {
    res.status(400).send({ error: error.message})
})

router.get('/user/:id/avatar', async (req, res) => {

    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(500).send(e)
    }
    
})
router.delete('/user/me/avatar/delete', auth, async (req, res) => {
    
    req.user.avatar = undefined
    await req.user.save()
    
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message})
})

module.exports = router