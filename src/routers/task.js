const express = require('express')
const router = new express.Router()
const auth  = require('../middleware/auth')
const Task = require('../models/task')


router.get('/tasks', auth, async (req, res) => {

    try {
        const match = {}
        const sort = {}
        if(req.query.completed) {
            match.completed = req.query.completed === 'true'
        } 
        // await Task.find({owner: req.user._id, completed})
        if(req.query.sortBy) {
            const parts = req.query.sortBy.split(':')
            sort[parts[0]] = parts[1] === 'desc' ? -1:1
        }

        await req.user.populate({ 
            path: 'tasks', 
            match , 
            options: { 
                limit:  parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/tasks/create', auth, async(req, res) => {
    // const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.patch('/task/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body) 
    const allowedUpdates = ['description','completed']
    const isValidOperator = updates.every((update) => allowedUpdates.includes(update))
    if(!isValidOperator) {
        return res.status(404).send({ error: 'Invlaid Updates!'})
    }
    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id}) 
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true})
        if(!task) {
            return res.status(404).send()
        } 
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/task/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({_id, owner: req.user._id})
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.delete('/task/:id', auth, async (req, res) => {

    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id})
        if(!task) {
            return res.status(404).send({error: 'Not Found'})
        }
        res.send({ message: 'Successfully Deleted!'})
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router