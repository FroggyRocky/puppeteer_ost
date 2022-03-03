const puppeteer = require('puppeteer');
const axios = require('axios');

const apiSMS = '480fbd81d8e829187Ad9A65cf6fdbdfb';
const apiCaptcha = 'cfad8201df8fe9768a86fb5d94bfe554';

const data = [
    {id:11,name:'George',surname:'King',birth:'11/01/1989',email:'nguu182@gmx.at',email_password:'@Abc123789@',address:'Patrick-Witt-Strase 7c',city:'Hoyerswerda',postal:'13754',password:'m2dWjB9heM',proxy_ip:'45.90.198.90:30011',proxy_login:'proxyost_gmail_com',proxy_password:'499f57f055'},
    /*{id: 1, name: 'Daguerre', surname: 'Smith', birth: '18/02/1996', email: 'isabel.m.1977@gmx.de', email_password: '@Abc123789@', address: 'Ludwiggasse 62a', city: 'Walsrode', postal: '24565', password: '5Mu7ckVSJq', proxy_ip: '196.18.2.126:8000', proxy_login: 'K0Xvje', proxy_password: 'rfLYnR'},
    {id: 1, name: 'Daguerre', surname: 'Smith', birth: '18/02/1996', email: 'mueller.sagard@web.de', email_password: '@Abc123789@', address: 'Ludwiggasse 62a', city: 'Walsrode', postal: '24565', password: '5Mu7ckVSJq', proxy_ip: '176.119.142.103:11167', proxy_login: 'ostproduct', proxy_password: '35fb4ost'},*/
];

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

async function west(id, name, surname, birth, email, email_password, address, city, postal, password, proxy_ip, proxy_login, proxy_password) {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            args: [ `--proxy-server=http://${proxy_ip}` ]
        });
        const page = await browser.newPage();
        await page.authenticate({username: proxy_login, password: proxy_password});
        await page.goto('https://my.weststeincard.com/auth/signup/private?locale=en', {waitUntil: 'load', timeout: 60000});
        await page.waitForTimeout(10000);
        await page.type('#name-input', name);
        await page.type('#surname-input', surname);
        await page.type('#dateOfBirth', birth);
        await page.type('#email', email);
        await page.type('#countryFilter', 'Ger');
        await page.$eval('#countryFilter', input => {
            input.nextElementSibling.getElementsByClassName('Dropdown__Item--Focus')[0].click();
        });
        await page.$eval('#countryFilter', input => input.value = 'Germany');
        await page.type('#address', address);
        await page.type('#city', city);
        await page.type('#postalCode', postal);
        await page.type('#phoneCountryFilter', '+372');
        await page.$eval('#phoneCountryFilter', input => {
            input.nextElementSibling.getElementsByClassName('Dropdown__Item--Focus')[0].click();
        });
       try {
            for (let i = 0; i <= 3; i++) {
                const response = await axios.get(`https://sms-activate.ru/stubs/handler_api.php?api_key=${apiSMS}&action=getNumber&service=th&country=34`);
                const data = response.data.split(/:/);
                if (data[1] && data[2]) {
                    await page.type('#phone', data[2].slice(3));
                    break;
                } else {
                    console.log(`${id}: номер для смс не получен попытка ${i}`);
                    await page.waitForTimeout(5000);
                }
            }
        } catch (e) {
            return console.log(`${id}: не смог отправить запрос на смс`)
        }
        await page.type('#password', password);
        await page.type('#passwordConfirm', password);
        await page.$eval('label[for="agree"]', label => {
            label.querySelector('span').click();
        });
        await page.$eval('label[for="agreeMonitored"]', label => {
            label.querySelector('span').click();
        });
        try {
            const frameCode = await page.frames()[0];
            const html = await frameCode.content();
            const token = html.match(/(?<=;k=)\w+/)[0];
            let response = await axios.get(`https://rucaptcha.com/in.php?key=${apiCaptcha}&method=userrecaptcha&googlekey=${token}&pageurl=https://my.weststeincard.com/auth/signup/private?locale=en&proxytype=HTTP&proxy=${proxy_login}:${proxy_password}@${proxy_ip}&json=1`);
            const captchaID = response.data.request;
            /*console.log(captchaID);*/
            await page.waitForTimeout(120000);
            response = await axios.get(`https://rucaptcha.com/res.php?key=${apiCaptcha}&json=1&id=${captchaID}&action=get`);
            /*console.log(response.data);*/
            if (response.data.status === 1) {
                const captchaResponse = response.data.request;
                await page.$eval('#g-recaptcha-response', (input, captchaResponse) => {
                    input.display = '';
                    input.innerHTML = captchaResponse
                }, captchaResponse);
                await page.evaluate((captchaResponse) => {
                    ___grecaptcha_cfg.clients[0].l.l.callback(captchaResponse);
                },captchaResponse);
                await page.click('button[type="submit"]');
            } else {
                return console.log(`${id}: Captcha не была пройдена на RuCaptcha`)
            }
        } catch (e) {
            console.log(e)
        }
        const link = email.split(/@/);
        const emailPage = await browser.newPage();
        await emailPage.authenticate({username: proxy_login, password: proxy_password});
        await emailPage.goto(`https://${link[1]}`);
        await emailPage.waitForTimeout(10000);
        const frame = await emailPage.frames().find(f => f.url().includes('plus'));
        if (await frame.$('#save-all-conditionally') !== null) {
            await frame.click('#save-all-conditionally');
            await emailPage.waitForTimeout(15000);

            if (await emailPage.$('input[name="username"]') !== null) {
                await emailPage.type('input[name="username"]', email);
            }
            await emailPage.waitForTimeout(1000);
            if (await emailPage.$('input[name="password"]') !== null) {
                await emailPage.type('input[name="password"]', email_password);
            }
            if (await emailPage.$('div[data-component="login"] button[data-importance="accent"]') !== null) {
                await emailPage.click('div[data-component="login"] button[data-importance="accent"]');
            }
            if (await emailPage.$('div[data-component="login"] button[data-importance="primary"]') !== null) {
                await emailPage.click('div[data-component="login"] button[data-importance="primary"]');
            }
            return console.log(`${id}: OK`)
        }
    } catch (e) {
        console.log(e)
    }
}

async function bulkWest () {
    await Promise.all(data.map(async el => {
            await delay(5000);
            return await west(el.id, el.name, el.surname, el.birth, el.email, el.email_password, el.address, el.city, el.postal, el.password, el.proxy_ip, el.proxy_login, el.proxy_password);
        }
    )).then(/*result => console.log(result)result => res.send(result)*/);
}
bulkWest().then();