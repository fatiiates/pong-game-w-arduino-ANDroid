import { Component } from '@angular/core'
import { BluetoothSerial } from '@ionic-native/bluetooth-serial'
import { LoadingController, AlertController, ToastController, Loading } from 'ionic-angular'

// Ionic için component özellikleri tanımlanıyor
@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})

// İstekleri karşılayacak class oluşturuluyor
export class HomePage {

	// Public değişkenler tanımlanıyor.
	pairedList: pairedlist
	listToggle: boolean = false
	pairedDeviceID: number = 0
	isOpen: boolean = false
	dataSend: string = ""
	isConnected: boolean = false
	locationX: number = 0

	// Kurucu metot kendisine verilen parametreleri otomatik olarak nesneye aktarıyor
	// örn: this.loadingController olarak erişilebilir
	constructor(public loadingController: LoadingController, private alertCtrl: AlertController, private bluetoothSerial: BluetoothSerial, private toastCtrl: ToastController) {
		
	}

	// İşlemler gerçekleştirilerken gösterilen loader
	presentLoadingWithOptions(content = "İşleminiz gerçekleştiriliyor..."): Loading {

		// Yeni bir loadingController oluşturuluyor.
		const loading =  this.loadingController.create({
		  spinner: null,
		  content: content,
		  cssClass: 'custom-class custom-loading',
		})

		// Controller ekranda gösteriliyor
		loading.present()
		
		// Controller kapandığında gerçekleşecek olaylar tanımlanıyor.
		loading.onDidDismiss(function(data, role){
			console.log('Loading dismissed with role:', role)
		})
		
		return loading
	}

	// Bluetooth'nin açık/kapalı durumunu kontrol eden metot
	checkBluetoothEnabled() {
		
		// Loader başlatılıyor
		const loading = this.presentLoadingWithOptions()

		// Durum kontrol ediliyor
		this.bluetoothSerial.isEnabled()
			.then(() => {
				// Açıksa loader kapatılıyor
				loading.dismiss()
			})
			.catch(error => {
				// Kapalıysa loader kapatılıyor ve açılması için uyarı veriyor
				loading.dismiss()
				this.showError("Lütfen Bluetooth aracınızı aktif hale getirin.")
			})
	}

	// Daha önce bluetooth eşleştirmesi yapılmış cihazları listeleyen metot
	listPairedDevices() {

		// Loader başlatılıyor
		const loading = this.presentLoadingWithOptions()

		// Listeleme gerçekleştiriliyor
		this.bluetoothSerial.list()
			.then(success => {
				// Listeleme başarılıysa veriler pairedList değişkenine aktarılıyor
				// Sayfada listeleme sağlanıyor
				// Loader kapatılıyor
				this.pairedList = success
				this.listToggle = true
				loading.dismiss()
			})
			.catch(error => {
				// Listeleme başarısızsa loader kapatılıyor
				// Hatalar ekrana yazılıyor
				// Sayfadan listeleme kaldırılıyor
				loading.dismiss()
				this.showError(error + ".\n")
				this.listToggle = false
			})
	}

	// Bir cihazı seçmeyi sağlıyor
	selectDevice() {

		// Seçilen cihazı diziden getiriyor
		let connectedDevice = this.pairedList[this.pairedDeviceID]
		// Eğer ki gelen nesne boş ise uyarı veriyor
		if (!connectedDevice.address) {
			this.showError('Eşleştirmek istediğiniz cihaz seçiniz.')
			return -1
		}
		// Cihazın adresini alıyor
		let address = connectedDevice.address

		// Cihaza bağlanıyor
		this.connect(address)
	}

	// Bir cihaza bağlanmayı sağlıyor
	connect(address) {

		// Loader başlatılıyor
		const loading = this.presentLoadingWithOptions()

		// Cihaza bağlanılıyor
		this.bluetoothSerial.connect(address)
			.subscribe(success => {
				// Bağlantı başarılıysa bluetoothSerial değişkenine abone olunuyor
				// Loader kapatılıyor
				// Kullanıcıya mesaj veriliyor
				// isConnected değişkeni güncelleniyor
				this.deviceConnected()
				loading.dismiss()
				this.showToast("Bluetooth bağlantısı başarılı!")
				this.isConnected = true
				
			}, error => {
				// Bağlantı başarısızsa abone olunduğu için abonelik sonlanana kadar çalışabilir
				// Loader kapatılıyor
				// isConnected değişkeni güncelleniyor
				// Kullanıcıya mesaj veriliyor
				if(loading)
					loading.dismiss()
				this.isConnected = false
				this.showError("Cihaz ile telefon arasındaki bağlantı koparıldı.")
			})
			
	}

	// BluetoothSerial değişkenine abone olmayı sağlıyor
	deviceConnected() {

		// Değişkenine abone olunuyor
		this.bluetoothSerial.subscribe('\n')
			.subscribe(success => {			
				return 0
			}, error => {
				this.showError(error)
			})
	}

	// Led kontrolü yapılmasını sağlıyor
	ledChange(param: boolean) {

		// Led açılıyorsa 7 kapanıyorsa 6 değeri cihaza iletiliyor
		this.dataSend = param ? '7': '6'
		this.bluetoothSerial.write(this.dataSend)
			.then(success => {
				// İşlem başarılıysa mesaj veriliyor
				// isOpen değişkeni güncelleniyor
				this.showToast(param ? 'AÇILDI': 'KAPATILDI')
				this.isOpen = !this.isOpen
			})
			.catch(error => {
				// İşlem başarısızsa mesaj veriliyor
				this.showError(error)
			})
	}

	// Pad'i hareket ettirmeyi sağlıyor
	moveTo(param: string) {

		// Değişken yerel bir değişkene aktarılıyor(0-5 arasında bir değere sahip olabilir) 
		// Parametre Right ise değer 1 azaltılıyor
		// Parametre Left ise değer 1 artırılıyor
		var newLocation: number = this.locationX
		if(param == 'Right')
			newLocation -= 1
		else if(param == 'Left')
			newLocation += 1
		else 
			return 0

		// Değer kontrolü yapılıyor
		if(newLocation > 5 || newLocation < 0){
			this.showToast('Sınırdasınız')
			this.bluetoothSerial.write("8")
			return 0
		}

		// Değer cihaza gönderiliyor
		this.bluetoothSerial.write(newLocation.toString())
			.then(success => {
				// Veri başarıyla iletildiyse değer güncelleniyor
				this.locationX = newLocation
			})
			.catch(error => {
				// Veriler iletilemediyse hata mesajı gösteriliyor
				this.showError(error)
			})
	}

	// Hata mesajı göstermeyi sağlıyor
	showError(error) {
		// Gönderilen parametreye göre hata componenti üretiyor
		// Component ekranda gösteriliyor
		let alert = this.alertCtrl.create({
			title: 'Hata',
			subTitle: error,
			buttons: ['Kapat']
		})
		alert.present()
	}	

	// Tost mesajları göstermeyi sağlıyor
	showToast(msj) {
		// Gönderilen parametreye göre toast component üretiyor
		// Component ekranda gösteriliyor
		const toast = this.toastCtrl.create({
			message: msj,
			duration: 1000
		})
		toast.present()
	}

}

// PairedList adında bir interface tanımlanıyor
// TypeScript dilinde interfaceler daha çok tip tanımlamada kullanılır
interface pairedlist {
	"class": number,
	"id": string,
	"address": string,
	"name": string
}