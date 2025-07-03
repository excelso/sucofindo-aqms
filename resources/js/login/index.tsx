import {Carousel, CarouselItem, CarouselOptions} from "flowbite";

document.addEventListener('DOMContentLoaded', function () {
    const carouselElement: HTMLElement = document.getElementById('carousel')
    const prevButton = document.getElementById('data-carousel-prev')
    const nextButton = document.getElementById('data-carousel-next')

    const passw = document.getElementsByClassName('passw')[0]
    const btnLookPass = document.getElementsByClassName('btnLookPass')[0]

    btnLookPass.addEventListener('click', function () {
        let currentType = passw.getAttribute('type') === 'password' ? 'text' : 'password'
        let currentTypeIcon = passw.getAttribute('type') === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'
        passw.setAttribute('type', currentType)
        btnLookPass.innerHTML = `<i class="${currentTypeIcon}"></i>`
    })

    //region Handle Carousel
    const items: CarouselItem[] = [
        {
            position: 0,
            el: document.getElementById('carousel-item-1'),
        },
        {
            position: 1,
            el: document.getElementById('carousel-item-2'),
        },
        {
            position: 2,
            el: document.getElementById('carousel-item-3'),
        },
    ]

    const options: CarouselOptions = {
        defaultPosition: 0,
        interval: 5000,
        indicators: {
            activeClasses: 'bg-white dark:bg-gray-800',
            inactiveClasses: 'bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800',
            items: [
                {
                    position: 0,
                    el: document.getElementById('carousel-indicator-1'),
                },
                {
                    position: 1,
                    el: document.getElementById('carousel-indicator-2'),
                },
                {
                    position: 2,
                    el: document.getElementById('carousel-indicator-3'),
                },
            ],
        }
    }

    const carousel = new Carousel(carouselElement, items, options)
    carousel.cycle()

    prevButton.addEventListener('click', () => {
        carousel.prev()
    })

    nextButton.addEventListener('click', () => {
        carousel.next()
    })
    //endregion
})
