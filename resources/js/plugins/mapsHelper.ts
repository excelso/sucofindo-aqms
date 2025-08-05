import {Loader} from "@googlemaps/js-api-loader";

class MapsHelper {
    loader = () => {
        return new Loader({
            apiKey: "AIzaSyAGK1ffZ1HjoenaTDRZDEV5HW783uTC7EY",
            version: "weekly",
        })
    }

    public mapsConfig = (mapContainerId: HTMLDivElement): Promise<any> => {
        return new Promise((resolve: any, reject) => {
            const loader = this.loader();
            loader.importLibrary('maps').then((libs) => {
                const {Map} = libs

                const center = {lat: -2.44565, lng: 117.8888}
                const map = new Map(mapContainerId, {
                    center: center,
                    zoom: 5,
                    mapTypeControl: true,
                    mapTypeId: 'satellite',
                    fullscreenControl: false,
                    streetViewControl: false,
                    zoomControl: true,
                    zoomControlOptions: {
                        position: google.maps.ControlPosition.LEFT_BOTTOM
                    },
                });

                let hideLabels = [{
                    featureType: "administrative.province",
                    stylers: [{visibility: "on"}]
                }, {
                    featureType: "administrative.locality",
                    stylers: [{visibility: "on"}]
                }, {
                    featureType: "poi",
                    stylers: [{visibility: "off"}]
                }, {
                    featureType: 'transit',
                    stylers: [{visibility: 'on'}]
                }, {
                    featureType: 'landscape.natural',
                    stylers: [{visibility: 'off'}]
                }];

                map.setOptions({styles: hideLabels});
                resolve({
                    map,
                    google
                })
            }).catch((error) => {
                reject(error)
            });
        });
    }
}

export default MapsHelper;
