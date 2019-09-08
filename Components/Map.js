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
                <MapView.Marker key={marker.key} coordinate={marker.latlong} title="Parcheggio Libero"
                onCalloutPress={(event) => props.BookParking(event, marker.latlong, marker.key)}/>))}
        </MapView>
    );
}

export default Maps;