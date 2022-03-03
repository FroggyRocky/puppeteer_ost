const mainServer = 'https://grebi-money.ru/api';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImFkbWluIjoxLCJpYXQiOjE2MDQ1NzcwNzB9.wlol2MkGxVmqh4HAA4JepDTDsf3kOA-IDL76Zrwe0_k';
const tbody = document.getElementById('tbody');
const hostsSelect = document.getElementsByClassName('hosts')[0];

async function loadData(host) {
    let info = '';
    try {
        const response = await fetch(`${mainServer}/get-phones`, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({host: host})
        });
        let result = await response.json();
        let options = '';
        result.hosts.forEach(el => options += `<option value="${el.host}">${el.host}"</option>`);
        hostsSelect.innerHTML = options;
        result.phones.forEach(el => info += `<tr>
            <td class="id">${el.id}</td>
            <td>${new Date(el.createdAt).toLocaleString('ru-RU')}</td>
            <td>${el.host}</td>
            <td>${el.name}</td>
            <td>${el.phone}</td>
            <td><textarea class="text" type="text" row="3" cols="10">${el.text}</textarea></td>
            <td><button class="waves-effect waves-light btn" onclick="getText(event)">Сохранить</button></td>
            <td><button class="delete-phone" onclick="deletePhone(event)"></button></td>
            </tr>`);
        tbody.innerHTML = info;
    } catch (e) {
        alert('Что-то не так - ошибка в консоли');
        console.log(e);
    }
}
async function getText(event) {
    try {
        const row = event.target.parentElement.parentElement;
        const response = await fetch(`${mainServer}/admin-phone`, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: row.getElementsByClassName('id')[0].innerText, text: row.getElementsByClassName('text')[0].value})
        });
        if (response.status === 200) event.target.innerText = 'OK';
    } catch (e) {
        console.log(e);
        event.target.innerText = 'ОШИБКА';
    }

}
async function deletePhone (event) {
    try {
        const row = event.target.parentElement.parentElement;
        const response = await fetch(`${mainServer}/admin-phone-delete`, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: row.getElementsByClassName('id')[0].innerText})
        });
        if (response.status === 200) row.remove();
    } catch (e) {
        alert('Хьюстон, у нас проблемы!');
        console.log(e);
    }
}
function hostClick() {
    loadData(hostsSelect.value).then();
}

loadData().then();
