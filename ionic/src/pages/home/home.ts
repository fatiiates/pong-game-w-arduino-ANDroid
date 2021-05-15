import { Component } from '@angular/core'
import { BluetoothSerial } from '@ionic-native/bluetooth-serial'
import { NavController, LoadingController, AlertController, ToastController } from 'ionic-angular'

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})

export class HomePage {
	pairedList: pairedlist
	listToggle: boolean = false
	pairedDeviceID: number = 0
	isOpened: boolean = false
	dataSend: string = ""
	isConnected: boolean = false

	constructor(public navCtrl: NavController, public loadingController: LoadingController, private alertCtrl: AlertController, private bluetoothSerial: BluetoothSerial, private toastCtrl: ToastController) {
		this.checkBluetoothEnabled()
	}

	presentLoadingWithOptions() {
		const loading =  this.loadingController.create({
		  spinner: null,
		  duration: 5000,
		  content: 'Click the backdrop to dismiss early...',
		  cssClass: 'custom-class custom-loading',
		});
		loading.present();
	
		loading.onDidDismiss(function(data, role){
			console.log('Loading dismissed with role:', role);
		});
		
	}

	checkBluetoothEnabled() {
		this.presentLoadingWithOptions();
		this.bluetoothSerial.isEnabled()
			.catch(error => {
				this.showError("Lütfen Bluetooth aracınızı aktif hale getirin.")
			})
	}

	listPairedDevices() {
		this.bluetoothSerial.list()
			.then(success => {
				this.pairedList = success
				this.listToggle = true
			})
			.catch(error => {
				this.showError(".\n")
				this.listToggle = false
			})
	}

	selectDevice() {
		let connectedDevice = this.pairedList[this.pairedDeviceID]
		if (!connectedDevice.address) {
			this.showError('Eşleştirmek istediğiniz cihaz seçiniz.')
			return -1
		}
		let address = connectedDevice.address

		this.connect(address)
	}

	connect(address) {
	// Attempt to connect device with specified address, call app.deviceConnected if success
		this.bluetoothSerial.connect(address)
			.subscribe(success => {
				this.deviceConnected()
				this.showToast("Bluetooth bağlantısı başarılı!")
				this.isConnected = true
			}, error => {
				this.showError(error)
			})
	}

	deviceConnected() {
	// Subscribe to data receiving as soon as the delimiter is read
		this.bluetoothSerial.subscribe('\n')
			.subscribe(success => {
				this.handleData(success)
				this.showToast("Cihaz bağlantısı başarılı!")
			}, error => {
				this.showError(error)
			})
	}

	deviceDisconnected() {
	// Unsubscribe from data receiving
		this.bluetoothSerial.disconnect()
		this.showToast("Cihaz bağlantısı başarıyla kapatıldı!")
	}

	handleData(data) {
		this.showToast(data)
	}

	ledChange(param: boolean) {
		this.dataSend = param ? 'ON': 'OFF'
		this.bluetoothSerial.write(this.dataSend)
			.then(success => {
				this.showToast(param ? 'AÇILDI': 'KAPATILDI')
				this.isOpened = !this.isOpened
			})
			.catch(error => {
				this.showError(error)
			})
	}

	showError(error) {
		let alert = this.alertCtrl.create({
			title: 'Hata',
			subTitle: error,
			buttons: ['Kapat']
		});
		alert.present()
	}	

	showToast(msj) {
		const toast = this.toastCtrl.create({
			message: msj,
			duration: 1000
		});
		toast.present()
	}

}

interface pairedlist {
	"class": number,
	"id": string,
	"address": string,
	"name": string
}