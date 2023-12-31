const { Router } = require('express')
const { isLogged } = require('../utils/helpers')

const Car = require('../database/Schemas/Car')

const router = Router()

router.get('/', async (req, res) => {
    if(!req.session.passport) return res.sendStatus(400)
    const user = await isLogged(req.session.passport)
    if(!user) return res.send('not logged')

    const allCars = await Car.find()
    const carsToSend = []
    allCars.forEach(car => {
        if(car.occupied.length > 0){
            const occupations = []
            car.occupied.forEach(occupation => {
                occupations.push({from: occupation.from, to: occupation.to})
            })
            carsToSend.push({_id: car._id, name: car.name, price: car.price, occupied: occupations, img: car.img})
        }
        else{
            carsToSend.push(car)
        }
    })
    res.send(carsToSend)
})

router.get('/admin', async (req, res) => {
    const user = await isLogged(req.session.passport)
    if(!user.isAdmin) return res.sendStatus(400)

    const allCars = await Car.find()
    
    res.send(allCars)
})

router.get('/:name', async (req, res) => {
    const user = await isLogged(req.session.passport)
    if(!user) return res.sendStatus(400)

    const car = await Car.findOne({name: req.params.name})
    const carToSend = []
    if(car.occupied.length > 0){
        const occupations = []
        car.occupied.forEach(occupation => {
            const days = Math.ceil((Date.parse(occupation.to) - Date.parse(occupation.from)) / (1000 * 3600 * 24))
            occupations.push({from: occupation.from, to: occupation.to, forDays: days})
        })
        carToSend.push({_id: car._id, name: car.name, price: car.price, occupied: occupations, img: car.img})
    }
    else{
        carToSend.push(car)
    }

    res.send(carToSend)
})

router.post('/reserve', async (req, res) => {
    const user = await isLogged(req.session.passport)
    if(!user) return res.sendStatus(400)

    const { car, termFrom, termTo } = req.body
    const carDB = await Car.findOne({ name: car })
    if(!carDB) return res.sendStatus(400)

    await carDB.updateOne({$push: {occupied: {from: termFrom, to: termTo, by: user.username}}})

    const days = Math.ceil((Date.parse(termTo) - Date.parse(termFrom)) / (1000 * 3600 * 24))
    const carPrice = days * carDB.price

    const reservationInfo = {
        days: days,
        car: car,
        price: carPrice,
        from: termFrom,
        to: termTo
    }
    res.send(reservationInfo)
})

router.post('/create', async (req, res) => {
    const user = await isLogged(req.session.passport)
    if(!user.isAdmin) return res.sendStatus(400)

    const { name, price, img} = req.body
    await Car.create({name, price, img})
    res.sendStatus(201)
})

router.post('/delete', async (req, res) => {
    const user = await isLogged(req.session.passport)
    if(!user.isAdmin) return res.sendStatus(400)

    const { order, car } = req.body

    const carDB = await Car.updateOne(
        { name: car },
        { $pull: { 'occupied': { by: order.by, from: order.from, to: order.to } } }
    )
    res.send(carDB)
})

module.exports = router