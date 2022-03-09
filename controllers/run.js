const puppeteer = require('puppeteer-core');
const axios = require('axios');
const fs = require('fs');
const { Console } = require('console');

const mlaPort = 35000;

async function get2Fa(code) {
    code = code.replace(/\s/g, '');
    const res = await axios.get(`http://2fa.live/tok/${code}`);
    return res.data.token;
}

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

async function createGroup(page, options) {
    if (options.group) {
        await page.goto('https://www.facebook.com/pages/creation/?ref_type=comet_home');
        await page.waitForTimeout(5000);
        if (await page.$('label[aria-label="Page name (required)"]')) {
            await page.click('label[aria-label="Page name (required)"] input');
            await page.type('label[aria-label="Page name (required)"] input', options.group.name, {delay: 95});
            await page.type('label[aria-label="Category (required)"] input', options.group.category, {delay: 97});
            await page.waitForTimeout(2000);
            await page.click('div[aria-busy="false"] li');
            await page.type('label[aria-label="Description"] textarea', options.group.description, {delay: 83});
            await page.click('div[aria-label="Create Page"]');
        }
    }
}

async function addBM(password, proxy_login, proxy_password, browser, options) {
    if (options.bm) {
        const bmPage = await browser.newPage();
        await bmPage.authenticate({username: proxy_login, password: proxy_password});
        await bmPage.goto('https://www.facebook.com');
        await bmPage.waitForTimeout(1000);
        const element = await bmPage.waitForSelector('div[data-pagelet="LeftRail"] span span');
        const text = await bmPage.evaluate(element => element.innerText, element);
        await bmPage.goto(options.bm);
        if (await bmPage.$('input[placeholder="First and Last Name"]') !== null) {
            await bmPage.type('input[placeholder="First and Last Name"]', text, {delay: 120});
            await bmPage.click('button div[data-hover="tooltip"]');
            await bmPage.waitForTimeout(2000);
            if (await bmPage.$('button div[data-hover="tooltip"]') !== null) {
                await bmPage.click('button div[data-hover="tooltip"]');
                await bmPage.waitForTimeout(2000);
                if (await bmPage.$('button div[data-hover="tooltip"]') !== null) {
                    await bmPage.click('button div[data-hover="tooltip"]');
                    await bmPage.waitForTimeout(2000);
                    if (await bmPage.$('#ajax_password') !== null) {
                        await bmPage.type('#ajax_password', password, {delay: 135});
                        await bmPage.click('button[data-testid="sec_ac_button"]');
                    }
                }
            }
        }
    }
}

async function closePopup(page) {
    if (await page.$('div[aria-label="Close Introduction"]') !== null) {
        await page.click('div[aria-label="Close Introduction"]');
    }
}

async function setCookie(cookie, page) {
    if (cookie) {
        let cookies = [];
        /*const page = await browser.newPage();*/
        await fs.readFile(`cookie/${cookie}.txt`, 'utf8',function (error, data) {
            let lines = data.split("\n");
            lines.forEach(function (line, index) {
                let tokens = line.split("\t");
                if (tokens.length === 7) {
                    tokens = tokens.map(function (e) {
                        return e.trim();
                    });
                    let cookie = {};
                    cookie.domain = tokens[0];
                    cookie.flag = tokens[1] === 'TRUE';
                    cookie.path = tokens[2];
                    cookie.secure = tokens[3] === 'TRUE';
                    let timestamp = tokens[4];
                    if (timestamp.length === 17) {
                        timestamp = Math.floor(timestamp / 1000000 - 11644473600);
                    }
                    cookie.expiration = timestamp;
                    cookie.name = tokens[5];
                    cookie.value = tokens[6];
                    cookies.push(cookie);
                }
            });
        });
        await page.goto('chrome-extension://fngmhnnpilhplaeedifhccceomclgfbg/popup.html');
        await page.waitForTimeout(500);
        if (await page.$('#pasteButton') !== null) {
            await page.click('#pasteButton');
            await page.waitForTimeout(1000);
            if (await page.$('#pasteCookie textarea') !== null) {
                await page.$eval('#pasteCookie textarea', (el, value) => el.value = JSON.stringify(value), cookies);
                await page.waitForTimeout(1000);
                if (await page.$('#submitButton') !== null) {
                    await page.click('#submitButton');
                    await page.waitForTimeout(1000);
                    /*await page.close();*/
                }
            }
        }
    }
}

async function videoQuality(page, options) {
    if (options.video === true) {
        await page.goto('https://www.facebook.com/settings?tab=videos', {waitUntil: 'load', timeout: 60000});
        await page.waitForTimeout(5000);
        const elementHandle = await page.waitForSelector('iframe');
        const frame = await elementHandle.contentFrame();
        try {
            if (await frame.$('#contentCol') !== null) {
                if (await frame.$('#contentCol #quality_setting') !== null) {
                    await frame.click('#contentCol #quality_setting');
                    await frame.waitForTimeout(1000);
                    if (await frame.$('div:not(.hidden_elem).uiContextualLayerPositioner.uiLayer ul[role="menu"]') !== null) {
                        await frame.click('div:not(.hidden_elem).uiContextualLayerPositioner.uiLayer ul[role="menu"] li:nth-child(2)');
                        await frame.waitForTimeout(1000);
                    }
                }
                if (await frame.$('#contentCol #autoplay_setting') !== null) {
                    await frame.click('#contentCol #autoplay_setting');
                    await frame.waitForTimeout(1000);
                    if (await frame.$('div:not(.hidden_elem).uiContextualLayerPositioner.uiLayer ul[role="menu"]') !== null) {
                        await frame.click('div:not(.hidden_elem).uiContextualLayerPositioner.uiLayer ul[role="menu"] li:nth-child(3)');
                        await frame.waitForTimeout(1000);
                    }
                }
            }
        } catch (e) {
            console.log(e)
        }
        await page.waitForTimeout(500);
        await page.goto('https://www.facebook.com/');
    }
}

async function createBM (proxy_login, proxy_password, options, browser, email, email_password) {
    if (options.createBM) {
        const pageCreateBM = await browser.newPage();
        await pageCreateBM.authenticate({username: proxy_login, password: proxy_password});
        await pageCreateBM.goto('https://business.facebook.com/overview', {waitUntil: 'load', timeout: 60000});
        await pageCreateBM.click('a[data-testid="business-create-account-button"]');
        await pageCreateBM.waitForTimeout(1000);
        const inputs = await pageCreateBM.$$('div[role="dialog"] input');
        let text = await pageCreateBM.evaluate((element) => element.value, inputs[1]);
        text = text.replace(/\s+/, "");
        await pageCreateBM.focus('div[role="dialog"] input');
        await pageCreateBM.keyboard.type(text, {delay: 100});
        await pageCreateBM.keyboard.press('Tab');
        await pageCreateBM.keyboard.press('Tab');
        await pageCreateBM.keyboard.type(email, {delay: 100});
        await pageCreateBM.click('div[role="none"] div[data-hover="tooltip"]');
        await pageCreateBM.waitForTimeout(5000);
        const pageEmail = await browser.newPage();
        await pageEmail.authenticate({username: proxy_login, password: proxy_password});
        const address = email.split(/@/);
        if (address[1] === 'hotmail.com') {
            await pageEmail.goto('https://outlook.live.com/', {waitUntil: 'load', timeout: 60000});
            await pageEmail.waitForTimeout(1000);
            await pageEmail.click('a[data-task="signin"]');
            await pageEmail.waitForTimeout(5000);
            await pageEmail.type('input[name="loginfmt"]', email, {delay: 101});
            await pageEmail.click('input[type="submit"]');
            await pageEmail.waitForTimeout(5000);
            await pageEmail.type('input[name="passwd"]', email_password, {delay: 130});
            await pageEmail.click('input[type="submit"]');
            await pageEmail.waitForTimeout(5000);
            if (await pageEmail.$('div[id="StartHeader"]') !== null) {
                await pageEmail.click('input[type="submit"]');
                await pageEmail.waitForTimeout(3000);
                if (await pageEmail.$('select[aria-label="Country code"]') !== null) {
                    await pageEmail.select('select[aria-label="Country code"]', 'VN');
                    await pageEmail.waitForTimeout(1000);
                }
            } else {
                if (await pageEmail.$('select[id="iProofOptions"]') !== null) {
                    await pageEmail.select('select[id="iProofOptions"]', 'Phone');
                    await pageEmail.waitForTimeout(2000);
                }
                if (await pageEmail.$('select[id="DisplayPhoneCountryISO"]') !== null) {
                    await pageEmail.select('select[id="DisplayPhoneCountryISO"]', 'VN');
                    await pageEmail.waitForTimeout(1000);
                }
            }
            try {
                const api = '9981A90c9f649353580cd88c75e98387';
                const response = await axios.get(`https://sms-activate.ru/stubs/handler_api.php?api_key=${api}&action=getNumber&service=mm&country=10`);
                console.log(response.data);
                const data = response.data.split(/:/);
                if (data[1] && data[2]) {
                    if (await pageEmail.$('input[id="DisplayPhoneNumber"]') !== null) {
                        await pageEmail.type('input[id="DisplayPhoneNumber"]', data[2].slice(2), {delay: 115});
                        await pageEmail.click('input[type="submit"]');
                    } else {
                        await pageEmail.type('input', data[2].slice(2), {delay: 115});
                        await pageEmail.click('a[title="Send SMS code"]');
                    }
                    async function getCode() {
                        for (let i = 0; i < 2; i++) {
                            await pageEmail.waitForTimeout(30000);
                            const response = await axios.get(`https://sms-activate.ru/stubs/handler_api.php?api_key=${api}&action=getStatus&id=${data[1]}`);
                            if (response.data !== 'STATUS_WAIT_CODE') {
                                const code = response.data.split(/:/)[1];

                                if (await pageEmail.$('input[id="iOttText"]') !== null) {
                                    await pageEmail.type('input[id="iOttText"]', code, {delay: 115});
                                    await pageEmail.waitForTimeout(1000);
                                    await pageEmail.click('input[type="submit"]');
                                    await pageEmail.waitForTimeout(4000);
                                    if (await pageEmail.$('input[name="proof"]') !== null) {
                                        await pageEmail.click('input[name="proof"]');
                                        const lastFourNumbers = data[2].slice(data[2].length - 4);
                                        await pageEmail.type('input[id="iProofPhone"]', lastFourNumbers, {delay: 115});
                                        await pageEmail.click('input[type="submit"]');
                                    }
                                } else {
                                    await pageEmail.type('input[aria-label="Enter the access code"]', code, {delay: 115});
                                    await pageEmail.click('input[type="submit"]');
                                    await pageEmail.waitForTimeout(3000);
                                }
                                break;
                            }
                        }
                    }
                    getCode().then();
                    if (await pageEmail.$('input[id="FinishAction"]') !== null) {
                        await pageEmail.click('input[id="FinishAction"]');
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
}

async function accessToken(proxy_login, proxy_password, browser) {
        const tokenPage = await browser.newPage();
        await tokenPage.authenticate({username: proxy_login, password: proxy_password});
        await tokenPage.goto('https://www.facebook.com/adsmanager');
        await tokenPage.waitForTimeout(5000);
        const html = await tokenPage.content();
        const token = html.match(/EAABsbCS1[a-zA-Z0-9]*/)[0];
        return {status: 'OK', token: token}
}

async function likes(page, options) {
    if (options.likes === true) {
        await page.evaluate(_ => {
            window.scroll(0, 2823);
        });
        if (await page.$('[data-sigil="ufi-inline-actions"] > div:nth-child(1)') !== null) {
            await page.waitForTimeout(5000);
            await page.click('[data-sigil="ufi-inline-actions"] > div:nth-child(1)');
        }
        await page.evaluate(_ => {
            window.scroll(0, 3230);
        });
        await page.waitForTimeout(5000);
        if (await page.$('[data-sigil="ufi-inline-actions"] > div:nth-child(1)') !== null) {
            await page.waitForTimeout(3000);
            await page.click('[data-sigil="ufi-inline-actions"] > div:nth-child(1)');
        }
        await page.evaluate(_ => {
            window.scroll(0, 1523);
        });
        await page.waitForTimeout(5000);
        if (await page.$('[data-sigil="ufi-inline-actions"] > div:nth-child(1)') !== null) {
            await page.waitForTimeout(3000);
            await page.click('[data-sigil="ufi-inline-actions"] > div:nth-child(1)');
        }
        await page.evaluate(_ => {
            window.scroll(0, 2533);
        });
        await page.waitForTimeout(5000);
        if (await page.$('[data-sigil="ufi-inline-actions"] > div:nth-child(1)') !== null) {
            await page.waitForTimeout(3000);
            await page.click('[data-sigil="ufi-inline-actions"] > div:nth-child(1)');
        }
        await page.evaluate(_ => {
            window.scroll(0, 1868);
        });
        await page.waitForTimeout(5000);
        if (await page.$('[data-sigil="ufi-inline-actions"] > div:nth-child(1)') !== null) {
            await page.waitForTimeout(3000);
            await page.click('[data-sigil="ufi-inline-actions"] > div:nth-child(1)');
        }
        await page.evaluate(_ => {
            window.scroll(0, 1388);
        });
        await page.waitForTimeout(5000);
        if (await page.$('[data-sigil="ufi-inline-actions"] > div:nth-child(1)') !== null) {
            await page.waitForTimeout(3000);
            await page.click('[data-sigil="ufi-inline-actions"] > div:nth-child(1)');
        }
    }
}

function waitForBasicGoToMain(page,browser, options, proxy_login, proxy_password, login, password, email, email_password, res) { console.log('wait and go');
     setTimeout(async () => {
        try {
            if(!page.isClosed()) {
                console.log('page is closed')
                await page.close()
            }
        } catch(err) {
            console.error('unexpected error occured when closing page.', err)
        }
       
    }, 10000) ///change to 30 min.

    onMainPage(browser, options, proxy_login, proxy_password, login, password, email, email_password, res).then();
} 

async function onMainPage(browser, options, proxy_login, proxy_password, login, password, email, email_password, res) {
    console.log('onmainpage')
    const context = browser.defaultBrowserContext();
    await context.overridePermissions("https://m.facebook.com/", ["notifications"]);
    const page = await browser.newPage();
    await page.authenticate({username: proxy_login, password: proxy_password});
    await setCookie(options.cookie, page).then();
    await page.goto('https://m.facebook.com/', {waitUntil: 'load', timeout: 60000});
    await page.waitForTimeout(10000);
    if(await page.$('#nux-nav-button')) {
        await page.click('#nux-nav-button')
    }
    if(page.$('[data-sigil="messenger_icon"]')) {
            await likes(page, options).then();
    // if (await page.'[data-sigil="ufi-inline-actions"] > div:nth-child(1)') !== null || await page.'[data-sigil="ufi-inline-actions"] > div:nth-child(1)'k"]') !== null) {
    //     await closePopup(page).then();
    //     await videoQuality(page, options).then();
    //     await likes(page, options).then();
    //     await createGroup(page, options).then();
    //     await createBM (proxy_login, proxy_password, options, browser, email, email_password).then();
    //     await addBM(password, proxy_login, proxy_password, browser, options).then();
    //     if (options.token) {
    //         const result = await accessToken(proxy_login, proxy_password, browser);
    //         return bulk ? {[login]: result} : res.send(result);
    //     }
    // }
}}

async function toEmail(proxy_login, proxy_password, email, email_password, browser) {
    const pageGmail = await browser.newPage();
    await pageGmail.authenticate({username: proxy_login, password: proxy_password});
    await pageGmail.goto('https://gmail.com/', {waitUntil: 'load', timeout: 60000});

    const address = email.split(/@/);
    const pageEmail = await browser.newPage();
    await pageEmail.authenticate({username: proxy_login, password: proxy_password});
    if (address[1] === 'hotmail.com') {
        await pageEmail.goto('https://outlook.live.com/', {waitUntil: 'load', timeout: 60000});
        await pageEmail.waitForTimeout(1000);
        if (await pageEmail.$('a[data-task="signin"]') !== null) {
            await pageEmail.click('a[data-task="signin"]');
            await pageEmail.waitForTimeout(5000);
        }
        if (await pageEmail.$('input[name="loginfmt"]') !== null) {
            await pageEmail.type('input[name="loginfmt"]', email, {delay: 101});
            await pageEmail.click('input[type="submit"]');
            await pageEmail.waitForTimeout(5000);
        }
        if (await pageEmail.$('input[name="passwd"]') !== null) {
            await pageEmail.type('input[name="passwd"]', email_password, {delay: 130});
            await pageEmail.click('input[type="submit"]');
            await pageEmail.waitForTimeout(5000);
        }
        if (await pageEmail.$('div[id="StartHeader"]') !== null) {
            await pageEmail.click('input[type="submit"]');
            await pageEmail.waitForTimeout(3000);
            if (await pageEmail.$('select[aria-label="Country code"]') !== null) {
                await pageEmail.select('select[aria-label="Country code"]', 'VN');
                await pageEmail.waitForTimeout(1000);
            } else {
                return
            }
        } else {
            if (await pageEmail.$('select[id="iProofOptions"]') !== null) {
                await pageEmail.select('select[id="iProofOptions"]', 'Phone');
                await pageEmail.waitForTimeout(2000);
            } else {
                return
            }
            if (await pageEmail.$('select[id="DisplayPhoneCountryISO"]') !== null) {
                await pageEmail.select('select[id="DisplayPhoneCountryISO"]', 'VN');
                await pageEmail.waitForTimeout(1000);
            }
        }
        try {
            const api = '9981A90c9f649353580cd88c75e98387';
            const response = await axios.get(`https://sms-activate.ru/stubs/handler_api.php?api_key=${api}&action=getNumber&service=mm&country=10`);
            console.log(response.data);
            const data = response.data.split(/:/);
            if (data[1] && data[2]) {
                if (await pageEmail.$('input[id="DisplayPhoneNumber"]') !== null) {
                    await pageEmail.type('input[id="DisplayPhoneNumber"]', data[2].slice(2), {delay: 115});
                    await pageEmail.click('input[type="submit"]');
                } else {
                    await pageEmail.type('input', data[2].slice(2), {delay: 115});
                    await pageEmail.click('a[title="Send SMS code"]');
                }
                async function getCode() {
                    for (let i = 0; i < 2; i++) {
                        await pageEmail.waitForTimeout(30000);
                        const response = await axios.get(`https://sms-activate.ru/stubs/handler_api.php?api_key=${api}&action=getStatus&id=${data[1]}`);
                        console.log(response.data);
                        if (response.data !== 'STATUS_WAIT_CODE') {
                            const code = response.data.split(/:/)[1];

                            if (await pageEmail.$('input[id="iOttText"]') !== null) {
                                await pageEmail.type('input[id="iOttText"]', code, {delay: 115});
                                await pageEmail.waitForTimeout(1000);
                                await pageEmail.click('input[type="submit"]');
                                await pageEmail.waitForTimeout(4000);
                                if (await pageEmail.$('input[name="proof"]') !== null) {
                                    await pageEmail.click('input[name="proof"]');
                                    const lastFourNumbers = data[2].slice(data[2].length - 4);
                                    await pageEmail.type('input[id="iProofPhone"]', lastFourNumbers, {delay: 115});
                                    await pageEmail.waitForTimeout(3000);
                                    if (await pageEmail.$('.button-container') !== null) {
                                        await pageEmail.click('.button-container');
                                    }
                                    await axios.get(`https://sms-activate.ru/stubs/handler_api.php?api_key=${api}&action=setStatus&status=3&id=${data[1]}`);
                                    await pageEmail.waitForTimeout(60000);
                                    const response = await axios.get(`https://sms-activate.ru/stubs/handler_api.php?api_key=${api}&action=getStatus&id=${data[1]}`);
                                    console.log(response.data);
                                    if (response.data) {
                                        const code = response.data.split(/:/)[1];
                                        if (await pageEmail.$('input[id="iOttText"]') !== null) {
                                            await pageEmail.type('input[id="iOttText"]', code, {delay: 115});
                                            await pageEmail.waitForTimeout(1000);
                                            await pageEmail.click('input[type="submit"]');
                                        }
                                        console.log('finish, script ends 1');
                                    }
                                }
                            } else {
                                await pageEmail.type('input[aria-label="Enter the access code"]', code, {delay: 115});
                                await pageEmail.click('input[type="submit"]');
                                await pageEmail.waitForTimeout(3000);
                                if (await pageEmail.$('input[id="FinishAction"]') !== null) {
                                    await pageEmail.click('input[id="FinishAction"]');
                                    await pageEmail.waitForTimeout(3000);
                                }
                                if (await pageEmail.$('select[id="iProofOptions"]') !== null) {
                                    await pageEmail.select('select[id="iProofOptions"]', 'Phone');
                                    await pageEmail.waitForTimeout(2000);
                                }
                                if (await pageEmail.$('select[id="DisplayPhoneCountryISO"]') !== null) {
                                    await pageEmail.select('select[id="DisplayPhoneCountryISO"]', 'VN');
                                    await pageEmail.waitForTimeout(1000);
                                }
                                if (await pageEmail.$('input[id="DisplayPhoneNumber"]') !== null) {
                                    await pageEmail.type('input[id="DisplayPhoneNumber"]', data[2].slice(2), {delay: 115});
                                    await pageEmail.click('input[type="submit"]');
                                    await pageEmail.waitForTimeout(3000);
                                }

                                await axios.get(`https://sms-activate.ru/stubs/handler_api.php?api_key=${api}&action=setStatus&status=3&id=${data[1]}`);
                                await pageEmail.waitForTimeout(60000);
                                const response = await axios.get(`https://sms-activate.ru/stubs/handler_api.php?api_key=${api}&action=getStatus&id=${data[1]}`);
                                console.log(response.data);
                                if (response.data) {
                                    const code = response.data.split(/:/)[1];

                                    if (await pageEmail.$('input[id="iOttText"]') !== null) {
                                        await pageEmail.type('input[id="iOttText"]', code, {delay: 115});
                                        await pageEmail.waitForTimeout(1000);
                                        await pageEmail.click('input[type="submit"]');
                                        await pageEmail.waitForTimeout(4000);
                                        if (await pageEmail.$('input[name="proof"]') !== null) {
                                            await pageEmail.click('input[name="proof"]');
                                            const lastFourNumbers = data[2].slice(data[2].length - 4);
                                            await pageEmail.type('input[id="iProofPhone"]', lastFourNumbers, {delay: 115});
                                            await pageEmail.waitForTimeout(3000);
                                            if (await pageEmail.$('.button-container') !== null) {
                                                await pageEmail.click('.button-container');
                                            }
                                            await axios.get(`https://sms-activate.ru/stubs/handler_api.php?api_key=${api}&action=setStatus&status=3&id=${data[1]}`);
                                            await pageEmail.waitForTimeout(60000);
                                            const response = await axios.get(`https://sms-activate.ru/stubs/handler_api.php?api_key=${api}&action=getStatus&id=${data[1]}`);
                                            console.log(response.data);
                                            if (response.data) {
                                                const code = response.data.split(/:/)[1];
                                                if (await pageEmail.$('input[id="iOttText"]') !== null) {
                                                    await pageEmail.type('input[id="iOttText"]', code, {delay: 115});
                                                    await pageEmail.waitForTimeout(1000);
                                                    await pageEmail.click('input[type="submit"]');
                                                }
                                                console.log('finish, script ends 2');
                                            }
                                        }
                                    }
                                }
                            }
                            break;
                        }
                    }
                }
                getCode().then();
            }
        } catch (e) {
            console.log(e);
        }
    }
}

exports.run = async (req, res) => {
    await runSingle(req.body.uuid, req.body.login, req.body.password, req.body.email, req.body.email_password, req.body.code2fa, req.body.proxy_ip, req.body.proxy_login, req.body.proxy_password, req.body.options, false, res);
};

exports.bulk = async (req, res) => {
    await Promise.all(req.body.map(async el => {
        await delay(1000);
        return await runSingle(el.uuid, el.login, el.password, el.email, el.email_password, el.code2fa, el.proxy_ip, el.proxy_login, el.proxy_password, el.options,true , res);
        }
    )).then(/*result => console.log(result)*/result => res.send(result));
};

async function runSingle(uuid, login, password, email, email_password, code2fa, proxy_ip, proxy_login, proxy_password, options, bulk, res) {
    try {
        await delay(5000);
        let response;
        try { 
            response = await axios.get(`http://localhost.multiloginapp.com:${mlaPort}/api/v1/profile/start?automation=true&puppeteer=true&profileId=${uuid}`);
        } catch (e) {
            return bulk ? {[login]: {status: 'Multilogin error'}} : res.send({status: 'Multilogin error'})
        }
        await delay(1000);
        if (response.data.value) {
            const browser = await puppeteer.connect({
                browserWSEndpoint: response.data.value,
                defaultViewport: null,
                args: [`--proxy-server=http://${proxy_ip}`],
                devtools: true
            });
            await delay(2000);
            const context = browser.defaultBrowserContext();
            await context.overridePermissions("https://mbasic.facebook.com/", ["notifications"]);
            const page = await browser.newPage();
            await page.authenticate({username: proxy_login, password: proxy_password});
            await setCookie(options.cookie, page).then();
            await page.goto('https://mbasic.facebook.com', {waitUntil: 'load', timeout: 60000});
            if (await page.$('#login_form > ul') !== null) {
                await page.type('#m_login_email', login, {delay: 99});
                await page.type('#password_input_with_placeholder > input', password, {delay: 101});
                await Promise.all([page.click('#login_form > ul > li:nth-child(3) > input'),page.waitForNavigation()])
                if (await page.$('#approvals_code') === null) { 
                    console.log('Old password');
                    return bulk ? {[login]: {status: 'Old password'}} : res.send({status: 'Old password'})
                }

            }
            // Проверяем на двухфакторку и вводим 2fa
            if (await page.$('#approvals_code') !== null) { 
                console.log('2fa')
                const faCode = await get2Fa(code2fa);
                await page.type('#approvals_code', faCode, {delay: 86});
                await page.click('#checkpointSubmitButton-actual-button');
                await page.waitForTimeout(4000);
                // Проверяем окно перед геолокацией
                if (await page.$('[name="submit[Continue]"]') !== null) { console.log('geo');
                    await page.click('#checkpointSubmitButton');
                    console.log(1);
                    await page.waitForTimeout(4000);
                }
                if (await page.$('button[name="submit[This was me]"]') !== null) { console.log('this was me after geo');
                    await page.click('#checkpointSubmitButton');
                    await page.waitForTimeout(4000);
                }
                // Проверяем окно для сохранение браузера чтобы не вводить 2fa
                if (await page.$('button[name="submit[This was me]"]') !== null) { console.log('2fa 1');
                    console.log('save 2fa');
                    await page.click('#checkpointSubmitButton');
                    await page.waitForTimeout(4000);
                }
                if (await page.$('#checkpointSecondaryButton') !== null) { console.log('2fa 2');
                    await page.click('#checkpointSubmitButton');
                    await page.waitForTimeout(4000);
                    if (await page.$('input[value="id_upload"]') !== null) { 
                        console.log('Checkpoint ID');
                        if (bulk) {
                            return {[login]: {status: 'Old password'}}
                        } else {
                            res.send({status: 'Old password'});
                            await toEmail(proxy_login, proxy_password, email, email_password, browser);
                        }
                        /*return res.send(`Checkpoint ID`);*/
                    }
                }
                
            } 
            if (await page.$('img[alt="Facebook logo"]')) {
                await waitForBasicGoToMain(page,browser, options, proxy_login, proxy_password, login, password, email, email_password, res);
                return bulk ? {[login]: {status: 'OK'}} : res.send({status: 'OK'});
            }
        } 
    } catch (err) {
        console.log(err.message);
    }
}

