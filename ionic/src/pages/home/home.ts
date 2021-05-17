import { Component } from '@angular/core'
import { BluetoothSerial } from '@ionic-native/bluetooth-serial'
import { NavController, LoadingController, AlertController, ToastController, Loading } from 'ionic-angular'

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})

export class HomePage {
	pairedList: pairedlist
	listToggle: boolean = false
	pairedDeviceID: number = 0
	isOpened: boolean = true
	dataSend: string = ""
	isConnected: boolean = false
	locationX: number = 0

	constructor(public navCtrl: NavController, public loadingController: LoadingController, private alertCtrl: AlertController, private bluetoothSerial: BluetoothSerial, private toastCtrl: ToastController) {
		this.checkBluetoothEnabled()
	}

	presentLoadingWithOptions(content = "İşleminiz gerçekleştiriliyor..."): Loading {
		const loading =  this.loadingController.create({
		  spinner: null,
		  content: content,
		  cssClass: 'custom-class custom-loading',
		})
		loading.present()
	
		loading.onDidDismiss(function(data, role){
			console.log('Loading dismissed with role:', role)
		})
		
		return loading
	}

	checkBluetoothEnabled() {
		const loading = this.presentLoadingWithOptions()
		this.bluetoothSerial.isEnabled()
			.then(() => {
				loading.dismiss()
			})
			.catch(error => {
				loading.dismiss()
				this.showError(error)
				//this.showError("Lütfen Bluetooth aracınızı aktif hale getirin.")
			})
	}

	listPairedDevices() {
		const loading = this.presentLoadingWithOptions()
		this.bluetoothSerial.list()
			.then(success => {
				this.pairedList = success
				this.listToggle = true
				loading.dismiss()
			})
			.catch(error => {
				loading.dismiss()
				this.showError(error + ".\n")
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
		const loading = this.presentLoadingWithOptions()
		var trest = this.bluetoothSerial.connect(address)
			.subscribe(success => {
				this.deviceConnected()
				loading.dismiss()
				this.showToast("Bluetooth bağlantısı başarılı!")
				this.isConnected = true
				
			}, error => {
				if(loading)
					loading.dismiss()
				this.isConnected = false
				this.showError("Cihaz ile telefon arasındaki bağlantı koparıldı.")
			})
			trest
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

	moveTo(param: string) {
		var newLocation: number = this.locationX
		if(param == 'Right')
			newLocation += 1
		else if(param == 'Left')
			newLocation -= 1
		else 
			return 0

		if(newLocation > 5 || newLocation < 0){
			this.showToast('Sınırdasınız')
			return 0
		}

		this.bluetoothSerial.write(newLocation.toString())
			.then(success => {			
				this.locationX = newLocation
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
		})
		alert.present()
	}	

	showToast(msj) {
		const toast = this.toastCtrl.create({
			message: msj,
			duration: 1000
		})
		toast.present()
	}

}

interface pairedlist {
	"class": number,
	"id": string,
	"address": string,
	"name": string
}