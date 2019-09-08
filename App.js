/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Fragment} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  PermissionsAndroid,
  Alert,
  ToastAndroid,
} from 'react-native';
import MapView from 'react-native-maps';
import Maps from './Components/Map.js'
import Geolocation from 'react-native-geolocation-service';
import getDirections from 'react-native-google-maps-directions';
import { Button, Overlay } from 'react-native-elements';
import firebase from 'react-native-firebase';
import { GoogleSignin, GoogleSigninButton, statusCodes } from 'react-native-google-signin';

GoogleSignin.configure({
  webClientId: '123239671899-1rmt1dt7a6rf11tapepgn6vgjfgrojrk.apps.googleusercontent.com',
  offlineAccess: true
});

class App extends React.Component {
  constructor(props){
    super(props);
    this.timeout =  0;
  };

  state = {
    startPosition: null,
    parkingAvailable: [],
    isParkingBooked: false,
    userEmail: "",
    sUid: null,
    parkingBooked: [],
    showUserRegister: true,
  }

  signIn = async () => {
    GoogleSignin.signIn()
    .then((data) => {
      // Create a new Firebase credential with the token
      data.scopes.push("https://www.googleapis.com/auth/firebase.database");
      const credential = firebase.auth.GoogleAuthProvider.credential(data.idToken, data.accessToken);
      // Login with the credential
      return firebase.auth().signInWithCredential(credential);
    })
    .then((user) => {
      user.user.getIdToken().then(sToken =>{
        this._renderParkingAvailabe();
        this.setState({userEmail: user.user._user.email, sUid: sToken, showUserRegister: false});
      });
    })
    .catch((error) => {
      const { code, message } = error;
      // For details of error codes, see the docs
      // The message contains the default Firebase string
      // representation of the error
    });
  };

  isSignedIn = async () => {
    let isSigned = await GoogleSignin.isSignedIn();
    isSigned = !isSigned;
    this.setState({showUserRegister: isSigned});
  };

  componentDidMount = async() => {
    this.setState({showUserRegister: true});
    this.isSignedIn();
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      Geolocation.getCurrentPosition(
        (position) => {
            console.log(position);
            let lat = position.coords.latitude;
            let long = position.coords.longitude;
            let oUserPos = {
              latitude: lat,
              longitude: long,
              latitudeDelta: 0.0122,
              longitudeDelta: 0.0121,
            };
            this.setState({startPosition: oUserPos});
        },
        (error) => {
            // See error code charts below.
            console.log(error.code, error.message);
            let oUserPos = {
              latitude: 0,
              longitude: 0,
              latitudeDelta: 0.0122,
              longitudeDelta: 0.0121,
            };
            this.setState({startPosition: oUserPos});
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }
  };

  _changeRegion = () => {

  };

  _leaveParking = async() => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      Geolocation.getCurrentPosition(
        (position) => {
            console.log(position);
            let lat = position.coords.latitude;
            let long = position.coords.longitude;
            let sUid = this.state.sUid;
            fetch("https://findyourparking-252309.firebaseio.com/parkingAvailable.json?auth="+sUid,{
              method: 'POST',
              body: JSON.stringify({
                lat: lat,
                long: long,
                userCode: this.state.userEmail,
              })
            }).then(res => {
              ToastAndroid.show("Posizione per il parcheggio salvata con successo!", ToastAndroid.LONG);
            }).catch(err => {
              console.log(err.toString());
              ToastAndroid.show("Ci spiace, è capitato un errore :(, Riprova!", ToastAndroid.LONG);
            });
        },
        (error) => {
            // See error code charts below.
            Alert.alert("Impossibile recuperare informazioni riguardo la posizione");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }
  };

  _renderParkingAvailabe = () => {
    if(!this.state.isParkingBooked){
      let sUid = this.state.sUid;
      fetch("https://findyourparking-252309.firebaseio.com/parkingAvailable.json?")
      .then(res => res.json())
      .then(oParking => {
        let aParkingAvailable = [];
        for(var key in oParking){
          if(this.state.userEmail !== oParking[key].userCode){
            let oParkInfo = {
              latlong:{
                latitude: oParking[key].lat,
                longitude: oParking[key].long,
              },
              key: key,
            }
            aParkingAvailable.push(Object.assign({}, oParkInfo));
          }
        }
        this.setState({parkingAvailable: aParkingAvailable});
        ToastAndroid.show("Aggiornata", ToastAndroid.SHORT);
      })
      .catch(err => {
        console.log(err.toString());
        ToastAndroid.show("E' accaduto un imprevisto nel caricare i parcheggi :(", ToastAndroid.LONG);
      });
      if(this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this._renderParkingAvailabe();
      }, 2000);
    }
  };

  _bookParking = (event, latlong, key) =>{
    let sUid = this.state.sUid;
    fetch('https://findyourparking-252309.firebaseio.com/parkingAvailable/' + key + '.json?auth='+sUid,{
      method: "delete"
    }).then(function(response){
      let aParkingBooked = [];
      let oParkInfo = {
        latlong:{
          latitude: latlong.latitude,
          longitude: latlong.longitude,
        },
        key: key,
      }
      aParkingBooked.push(Object.assign({}, oParkInfo));
      this.setState({isParkingBooked: true, parkingBooked: aParkingBooked, parkingAvailable: []});
      ToastAndroid.showWithGravity(
        'Parcheggio prenotato!',
        ToastAndroid.LONG,
        ToastAndroid.CENTER,
      );
    }.bind(this)).catch(function(){
      console.log("err delete favorite")
    }.bind(this));
  };

  _renderMapsButton = () => {
    if(this.state.isParkingBooked){
      return <View style={{position: 'absolute', top: 55, right: 0, zIndex: 1, backgroundColor: "white", borderRadius: 10}}>
              <Button title="Arrivaci con Maps" type='clear' onPress={this._getThereByMaps}></Button>
            </View>;
    }
  };

  _renderDeleteBookingButton = () => {
    if(this.state.isParkingBooked){
      return <View style={{position: 'absolute', top: 105, right: 0, zIndex: 1, backgroundColor: "white", borderRadius: 10}}>
              <Button title="Libera parcheggio" type='clear' onPress={this._deleteBooking}></Button>
            </View>;
    }
  };

  _deleteBooking = () => {
    let oParkingBooked = this.state.parkingBooked;
    let sUid = this.state.sUid;
    fetch("https://findyourparking-252309.firebaseio.com/parkingAvailable.json?auth="+sUid,{
      method: 'POST',
      body: JSON.stringify({
        lat: oParkingBooked[0].latlong.latitude,
        long: oParkingBooked[0].latlong.longitude,
        userCode: this.state.userEmail,
      })
    }).then(res => {
      this.setState({parkingBooked: [], isParkingBooked: false});
      this._renderParkingAvailabe();
      ToastAndroid.show("Posizione per il parcheggio salvata con successo!", ToastAndroid.LONG);
    }).catch(err => {
      console.log(err.toString());
      ToastAndroid.show("Ci spiace, è capitato un errore :(, Riprova!", ToastAndroid.LONG);
    });
  };

  _getThereByMaps = async() => {
    let oParkingBooked = this.state.parkingBooked;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      Geolocation.getCurrentPosition(
        (position) => {
            console.log(position);
            const oDataForMaps = {
              source: {
               latitude: position.coords.latitude,
               longitude: position.coords.longitude,
             },
             destination: {
               latitude: oParkingBooked[0].latlong.latitude,
               longitude: oParkingBooked[0].latlong.longitude,
             },
             params: [
               {
                 key: "travelmode",
                 value: "driving"        // may be "walking", "bicycling" or "transit" as well
               },
               {
                 key: "dir_action",
                 value: "navigate"       // this instantly initializes navigation using the given travel mode
               }
             ]
           }
        
           getDirections(oDataForMaps);
        },
        (error) => {
            // See error code charts below.
            console.log(error.code, error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }
  };

  _renderLeaveParkingButton = () => {
    if(!this.state.isParkingBooked){
      return <View style={{position: 'absolute', top: 5, right: 0, zIndex: 1, backgroundColor: "white", borderRadius: 10}}>
              <Button title="Rendi disponibile parcheggio" type='clear' onPress={this._leaveParking}></Button>
            </View>;
    }else {
      return <View></View>
    }
  };

  _renderOverlay = () => {
    if(this.state.showUserRegister){
      return <Overlay style={{height: '100%', width: '100%'}} isVisible={this.state.showUserRegister}>
                <View style={{position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 10}}>
                          <Text style={{textAlign:'center'}}>Ehilà! Per usare la nostra app effettua il login con Google!</Text>
                          <GoogleSigninButton
                            style={{ width: 192, height: 48 }}
                            size={GoogleSigninButton.Size.Wide}
                            color={GoogleSigninButton.Color.Dark}
                            onPress={this.signIn}/>
                </View>
              </Overlay>;
    }else{
      return <View></View>
    }
  };

  render() {
    return (
      <View style={{width: '100%', height: '100%'}}>
        {this._renderOverlay()}
        <Maps UserPosition={this.state.startPosition} Parkings={this.state.parkingAvailable} RegionChange={this._changeRegion}
        BookParking={this._bookParking} Booked={this.state.parkingBooked} GetThereWithMaps={this._getThereByMaps}></Maps>
        {this._renderLeaveParkingButton()}
        {this._renderMapsButton()}
        {this._renderDeleteBookingButton()}
      </View>
    );
  }
};


export default App;
