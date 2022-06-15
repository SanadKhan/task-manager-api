 const mailgun = require('mailgun-js')


 const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN})

//  const sendWelcomeEmail = {
//     from: 'Excited User <me@samples.mailgun.org>',
//     to: 'khansanad986@gmail.com',
//     subject: 'hello',
//     text: 'Testing some Mailgun awesomness!'
//  };

const sendWelcomeEmail = (email,name) => {
    mg.messages().send({
        from: 'Excited User <me@samples.mailgun.org>',
        to: email,
        subject: 'Thanks for Joining In!',
        text: 'Welcome to the app, ${name}. Let me know how you get along with the'
    }, function (error, body) {
        console.log(body)
    })
}

const sendCancellationEmail = (email, name) => {
    mg.messages().send({
        from: 'Excited User <me@samples.mailgun.org>',
        to: email,
        subject: 'Sorry to see you go!',
        text: 'We are Sorry to hear that your are cancelling if there anything we would help, ${name}. Let me know how you get along with the'
    }, function (error, body) {
        console.log(body)
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}