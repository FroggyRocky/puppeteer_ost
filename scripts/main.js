const localServer = 'http://localhost:3005/multi';
const mainServer = 'http://350044-cq02541.tmweb.ru/api';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImFkbWluIjoxLCJpYXQiOjE2MDQ1NzcwNzB9.wlol2MkGxVmqh4HAA4JepDTDsf3kOA-IDL76Zrwe0_k';
const tbody = document.getElementById('tbody');
const load = document.getElementById('load');
const count = document.getElementById('count');
const countryInput = document.getElementsByClassName('countries')[0];
const idInput = document.getElementsByClassName('account-id')[0];

document.getElementById('bulk').onclick = runBulk;
countryInput.onchange = function (event) {
    loadData(event.target.value, null).then();
};
idInput.onkeyup = function (event) {
    loadData(null, event.target.value).then();
};

loadData().then();

async function loadData(country, id) {
    try {
        let info = '';
        const response = await fetch(`${mainServer}/multi-accounts`, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({country: country, id: id})
        });
        let result = await response.json();
        // console.log(result);
        tbody.innerHTML = '';
        let options = '';
        result.countries.forEach((el,i) => options += `${i === 0 && '<option value=""></option>'}<option value="${el.id}">${el.name}</option>`);
        countryInput.innerHTML = options;
        result.accounts.forEach(el => info += `<tr>
        <td class="id">
            <label><input type="checkbox" class="filled-in id" value="${el.id}" onchange="countChecked()">
            <span>${el.id} ${el.country.name}</span>
            </label>
        </td>
        <td class="options">
            <input type="text" class="browser-default cookie" placeholder="cookie">
            <br>
            <label><input type="checkbox" class="filled-in likes" checked>
            <span>Likes</span>
            </label>
            <br>
            <label><input type="checkbox" class="filled-in token" ${!el.token && 'checked'}>
            <span>Token</span>
            </label>
            <br>
            <label><input type="checkbox" class="filled-in video" ${!el.token && 'checked'}>
            <span>Video</span>
            </label>
        </td>
        <td class="with-input">
            <label>
                <input type="checkbox" class="filled-in group" onclick="groupChecked(event)">
                <span>Group</span>
            </label>
            <br>
            <input type="text" value="Kitzen Club" class="browser-default group-name" disabled>
            <br>
            <input type="text" value="Just For Fun" class="browser-default group-category" disabled>
            <br>
            <input type="text" value="Karnevals Club Kitzen e.V. Seite. Bekanntmachung. 9. September 2018. ... Sportler Seit Beginn unseres Vereins gehören auch die Sportler des SV Blau-Gelb" class="browser-default group-description" disabled>
            </td>
        <td>
            <label><input type="checkbox" class="filled-in bm" onclick="bmChecked(event)">
            <span>BM</span>
            </label>
            <br>
            <input type="text" class="browser-default bm-link" disabled>
        </td>
        <td class="login">${el.login}</td>
        <td class="password">${el.password}</td>
        <td>${el.birth}</td>
        <td class="status" id="${el.login}"></td>
        <td>
            <button class="waves-effect waves-light btn" onclick="getData(event)" data-proxy_ip="${el.proxy_ip}" data-proxy_login="${el.proxy_login}" data-proxy_password="${el.proxy_password}" data-code2fa="${el.code2fa}" data-uuid="${el.uuid}" data-email="${el.email}" data-email_password="${el.email_password}">Открыть</button>
        </td>
        </tr>
        <tr>
            <td colspan="9">startProfile('${el.uuid}','${el.login}','${el.password}', '${el.email}', '${el.email_password}', '${el.code2fa}','${el.proxy_ip}','${el.proxy_login}','${el.proxy_password}').then();</td>
        </tr>`);
        tbody.innerHTML = info;
    } catch (e) {
        console.log(e)
    }
}
/*<td>
<button class="waves-effect waves-light btn" data-uuid="${el.uuid}" onclick="importCookie(event)">+Cookie</button>
</td>
async function importCookie (event) {
    const parent = event.target.parentElement.parentElement;
    const cookie = parent.getElementsByClassName('cookie')[0].dataset.cookie;
    const uuid = event.target.dataset.uuid;
    const res = await fetch(`http://localhost.multiloginapp.com:35000/api/v1/cookies/import/webext&profileId=${uuid}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(cookie)
    });
    let result = await res.json();
    console.log(result)
}*/
function countChecked() {
    const checkedBoxes = document.querySelectorAll('input[class="filled-in id"]:checked');
    count.innerText = checkedBoxes.length.toString();
}

function groupCheckbox(event) {
    const checkboxes = document.querySelectorAll('input[class="filled-in id"]:checked');
    const classList = event.target.classList;
    function selectCheckbox(element) {
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].parentElement.parentElement.parentElement.getElementsByClassName(element)[0].checked = event.target.checked
        }
    }
    if (classList.contains('group-likes')) {
        selectCheckbox('likes')
    } else if (classList.contains('group-cookie')) {
        selectCheckbox('cookie')
    } else if (classList.contains('group-token')) {
        selectCheckbox('token')
    }else if (classList.contains('group-video')) {
        selectCheckbox('video')
    } else {
        selectCheckbox('group')
    }
}

function groupChecked(event) {
    const group = event.target.parentElement.parentElement.getElementsByClassName('browser-default');
    for (let i = 0; i < group.length; i++) {
        group[i].disabled = !event.target.checked;
    }
}

function bmChecked(event) {
    const bm = event.target.parentElement.nextElementSibling.nextElementSibling;
    bm.disabled = !event.target.checked;
}

async function getData(event) {
    const parent = event.target.parentElement.parentElement;
    const target = event.target;
    const data = {};
    target.innerText = 'LOADING';
    data.token = token;
    data.login = parent.getElementsByClassName('login')[0].innerText;
    data.password = parent.getElementsByClassName('password')[0].innerText;
    data.code2fa = target.dataset.code2fa;
    data.uuid = target.dataset.uuid;
    data.proxy_ip = target.dataset.proxy_ip;
    data.proxy_login = target.dataset.proxy_login;
    data.proxy_password = target.dataset.proxy_password;
    data.email = target.dataset.email;
    data.email_password = target.dataset.email_password;
    data.options = {
        likes: parent.getElementsByClassName('likes')[0].checked,
        token: parent.getElementsByClassName('token')[0].checked,
        video: parent.getElementsByClassName('video')[0].checked,
        cookie: parent.getElementsByClassName('cookie')[0].value
    };
    if (parent.getElementsByClassName('group')[0].checked === true) {
        data.options.group = {
            name: parent.getElementsByClassName('group-name')[0].value,
            category: parent.getElementsByClassName('group-category')[0].value,
            description: parent.getElementsByClassName('group-description')[0].value
        };
    }
    if (parent.getElementsByClassName('bm')[0].checked === true) {
        data.options.bm = parent.getElementsByClassName('bm-link')[0].value;
    }
    try{
        const res = await fetch(`${localServer}/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        let result = await res.json();
        console.log(result);
        if (result.token) {
            await fetch(`${mainServer}/multi-token`, {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({login: parent.getElementsByClassName('login')[0].innerText, token: result.token})
            });
        }
        result.status === 'OK' ? result = '<span class="green-text">OK</span>' : result = `<span class="red-text">${result.status}</span>`;
        parent.getElementsByClassName('status')[0].innerHTML = result;
        target.innerText = 'ГОТОВО';
    } catch (e) {
        console.log(e)
    }
}
async function runBulk () {
    const accounts = [];
    const checkedBoxes = document.querySelectorAll('input[class="filled-in id"]:checked');
    for (let i = 0; i < checkedBoxes.length; i++) {
        const data = {};
        const tr = checkedBoxes[i].parentElement.parentElement.parentElement;
        data.token = token;
        data.login = tr.getElementsByClassName('login')[0].innerText;
        data.password = tr.getElementsByClassName('password')[0].innerText;
        data.code2fa = tr.getElementsByClassName('waves-effect')[0].dataset.code2fa;
        data.uuid = tr.getElementsByClassName('waves-effect')[0].dataset.uuid;
        data.proxy_ip = tr.getElementsByClassName('waves-effect')[0].dataset.proxy_ip;
        data.proxy_login = tr.getElementsByClassName('waves-effect')[0].dataset.proxy_login;
        data.proxy_password = tr.getElementsByClassName('waves-effect')[0].dataset.proxy_password;
        data.email = tr.getElementsByClassName('waves-effect')[0].dataset.email;
        data.email_password= tr.getElementsByClassName('waves-effect')[0].dataset.email_password;
        data.options = {
            likes: tr.getElementsByClassName('likes')[0].checked,
            token: tr.getElementsByClassName('token')[0].checked,
            video: tr.getElementsByClassName('video')[0].checked,
            cookie: tr.getElementsByClassName('cookie')[0].value
        };
        if (document.getElementsByClassName('group-create-bm')[0].checked === true) {
            data.options.createBM = true;
        }
        if (tr.getElementsByClassName('group')[0].checked === true) {
            data.options.group = {
                name: tr.getElementsByClassName('group-name')[0].value,
                category: tr.getElementsByClassName('group-category')[0].value,
                description: tr.getElementsByClassName('group-description')[0].value
            };
        }
        if (tr.getElementsByClassName('bm')[0].checked === true) {
            data.options.bm = tr.getElementsByClassName('bm-link')[0].value;
        }
        accounts.push(data)
    }
    try {
        const res = await fetch(`${localServer}/run-bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(accounts)
        });
        let result = await res.json();
        console.log(result);
        if (result) {
            result.map(async el => {
                const name = Object.keys(el)[0];
                const elem = document.getElementById(name);
                if (el[name].token) {
                    await fetch(`${mainServer}/multi-token`, {
                        method: 'POST',
                        headers: {
                            Authorization: 'Bearer ' + token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({login: name, token: el[name].token})
                    });
                }
                elem.innerHTML = el[name].status === 'OK' ? '<span class="green-text">OK</span>' : `<span class="red-text">${el[name].status}</span>`;
            });
        }
    } catch (e) {
        console.log(e)
    }
}