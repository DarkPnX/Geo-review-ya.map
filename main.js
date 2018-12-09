ymaps.ready(init);

function init () {
    let reviewForm = document.querySelector('#popup'),
        addressElement = document.querySelector('#top_popup'),
        closeFormBtn = document.querySelector('#close_btn'),
        reviewList = document.querySelector('#review_list'),
        emptyMessage = document.querySelector('#empty_message'),
        reviewerName = document.querySelector('#reviewer_name'),
        reviewPlace = document.querySelector('#place'),
        reviewText = document.querySelector('#review_text'),
        saveBtn = document.querySelector('#btn');

    let currentReview = {},
        allReviews = [];

    function clearForm() {
        addressElement.textContent = '';
        reviewList.innerHTML = '';
        emptyMessage.style.display = 'block';
        reviewerName.value = '';
        reviewPlace.value = '';
        reviewText.value = '';
    }

    function closeForm() {
        clearForm();
        reviewForm.style.display = 'none';
    }

    function fillReviewList(address) {
        reviewList.innerHTML = '';
        for (let review of allReviews) {
            if (review.address === address) {
                emptyMessage.style.display = 'none';
                currentReview.address = review.address;
                currentReview.coords = review.coords;
                let reviewItem = `<li>
                <span class="username">${review.reviewer} </span>
                <span class="place"> ${review.place}</span> <span class="date">${review.date}</span>
                <div class="review_text">${review.text}</div>
                </li>`;
                reviewList.innerHTML += reviewItem;
            }
        }
    }

    function showForm(address) {
        addressElement.textContent = address;
        fillReviewList(address);
        reviewerName.focus();
        reviewForm.style.display = 'block';
    }

    function addPlacemark(activeReview) {
        let {coords, address, reviewer, place, date, text} = activeReview;
        let placemark = new ymaps.Placemark(coords, {
            balloonContentHeader: `<div class="place_bal">${place}</div><div class="address_bal">${address}</div>`,
            balloonContentBody: text,
            balloonContentFooter: date,
            hintContent: `<b>${reviewer}</b> ${place}`
        }, {
            preset: 'islands#blueIcon',
            openBalloonOnClick: false
        });
        placemark.events.add('click', () => showForm(address));
        clusterer.add(placemark);
    }

    function addReview() {
        currentReview.reviewer = reviewerName.value;
        currentReview.place = reviewPlace.value;
        currentReview.text = reviewText.value;
        currentReview.date = new Date().toLocaleString();
        if (!currentReview.reviewer || !currentReview.place || !currentReview.text) {
            return;
        }
        allReviews.push(Object.assign({}, currentReview));
        addPlacemark(currentReview);
        fillReviewList(currentReview.address);
        reviewerName.value = '';
        reviewPlace.value = '';
        reviewText.value = '';
    }

    function getClustererWithCarousel() {
        let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
            '<div class=header_bal>{{ properties.balloonContentHeader|raw }}</div>' +
            '<div class=body_bal>{{ properties.balloonContentBody|raw }}</div>' +
            '<div class=footer_bal>{{ properties.balloonContentFooter|raw }}</div>'
        );

        return new ymaps.Clusterer({
            openBalloonOnClick: true,
            clusterDisableClickZoom: true,
            clusterOpenBalloonOnClick: true,
            clusterHideIconOnBalloonOpen: false,
            // Устанавливаем для балуна кластера стандартный макет типа "Карусель".
            clusterBalloonContentLayout: 'cluster#balloonCarousel',
            // Устанавливаем собственный макет.
            clusterBalloonItemContentLayout: customItemContentLayout,
            // Устанавливаем режим открытия балуна.
            // В данном примере балун никогда не будет открываться в режиме панели.
            clusterBalloonPanelMaxMapArea: 0,
            // Устанавливаем размеры макета контента балуна (в пикселях).
            clusterBalloonContentLayoutWidth: 200,
            clusterBalloonContentLayoutHeight: 130,
            // Устанавливаем максимальное количество элементов в нижней панели на одной странице
            clusterBalloonPagerSize: 5
        });
    }

    let myMap = new ymaps.Map('map', {
        center: [55.753994, 37.622093],
        zoom: 9
    });

    let clusterer = getClustererWithCarousel();
    myMap.geoObjects.add(clusterer);

    myMap.events.add('click', e => {
        let coords = e.get('coords');
        clearForm();
        ymaps.geocode(coords)
            .then(res => {
                currentReview.coords = coords;
                currentReview.address = res.geoObjects.get(0).getAddressLine();
                showForm(currentReview.address);
            })
            .catch(err => console.error(err));
    });
    saveBtn.addEventListener('click', addReview);
    closeFormBtn.addEventListener('click', closeForm);
    map.addEventListener('click', e => {
        if (e.target.className === 'address_bal') {
            myMap.balloon.close();
            showForm(e.target.textContent);
        }
    });
}