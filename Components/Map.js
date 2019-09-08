import React from "react";
import { ScrollView, Button, View, Text, ActivityIndicator } from "react-native";
import MapView from 'react-native-maps';
import Marker from 'react-native-maps';

const Maps = props =>{

    return (
        <MapView style={{width: '100%', height: '100%'}}
            initialRegion={props.UserPosition}
            loadingEnabled={true}
            onRegionChangeComplete={(event) => props.RegionChange(event)}
            showsUserLocation={true}
            zoomEnabled={true}
            zoomTapEnabled={true}
            >
            {props.Parkings.map((marker, i) => (
                <MapView.Marker key={marker.key} coordinate={marker.latlong} title="Parcheggio Libero" description="Clicca qui per prenotarlo!"
                onCalloutPress={(event) => props.BookParking(event, marker.latlong, marker.key)}/>))}
            {props.Booked.map((marker, i) => (
                <MapView.Marker key={marker.key} coordinate={marker.latlong} title="Parcheggio Prenotato" description="Clicca per arrivarci con Maps!"
                onCalloutPress={(event) => props.GetThereWithMaps(event, marker.latlong, marker.key)}/>))}
        </MapView>
    );
}

export default Maps;
