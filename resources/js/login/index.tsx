document.addEventListener('DOMContentLoaded', function () {
    const passw = document.getElementsByClassName('passw')[0]
    const btnLookPass = document.getElementsByClassName('btnLookPass')[0]

    btnLookPass.addEventListener('click', function () {
        let currentType = passw.getAttribute('type') === 'password' ? 'text' : 'password'
        let currentTypeIcon = passw.getAttribute('type') === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'
        passw.setAttribute('type', currentType)
        btnLookPass.innerHTML = `<i class="${currentTypeIcon}"></i>`
    })
})
