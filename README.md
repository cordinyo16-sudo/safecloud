# SafeCloud - Oda Bazlı Çevrim İçi Durum Sistemi

## 📋 Özellik Açıklaması

Bu sistemde kullanıcılar **doğrudan çevrim içi görünmezler**. Kullanıcılar sadece **aynı odada** oldukları zaman birbirlerini çevrim içi olarak görebilirler.

### Önceki Davranış:
- Kullanıcı bağlandığında herkese çevrim içi görünüyordu

### Yeni Davranış:
- Kullanıcı bağlandığında çevrim içi görünmez
- Kullanıcı bir odaya katıldığında, sadece o odadaki diğer kullanıcılar onu çevrim içi olarak görür
- Farklı odalardaki kullanıcılar birbirlerini çevrim içi olarak göremezler

## 🚀 Kurulum

```bash
npm install
npm start
```

Sunucu http://localhost:3000 adresinde çalışmaya başlayacaktır.

## 🧪 Testler

```bash
npm test
```

## 📁 Proje Yapısı

```
safecloud/
├── server/
│   ├── index.js           # Ana sunucu dosyası (Socket.io)
│   ├── roomManager.js     # Oda ve çevrim içi durum yönetimi
│   └── roomManager.test.js # Testler
├── client/
│   └── index.html         # İstemci arayüzü
├── package.json
└── README.md
```

## 🔧 API Olayları (Socket.io)

### İstemciden Sunucuya:
- `joinRoom` - Bir odaya katıl (çevrim içi olmak için)
- `leaveRoom` - Odadan ayrıl
- `getOnlineUsers` - Bir odadaki çevrim içi kullanıcıları al

### Sunucudan İstemciye:
- `onlineUsers` - Odadaki çevrim içi kullanıcı listesi
- `userJoined` - Bir kullanıcı odaya katıldı
- `userLeft` - Bir kullanıcı odadan ayrıldı

## 💡 Kullanım Örneği

```javascript
// İstemci tarafı
const socket = io();

// Odaya katıl - bu adımdan SONRA çevrim içi görünürsün
socket.emit('joinRoom', {
  roomId: 'room-1',
  userId: 'user-123',
  userName: 'Ali'
});

// Odadaki çevrim içi kullanıcıları dinle
socket.on('onlineUsers', (data) => {
  console.log(`${data.roomId} odasındaki kullanıcılar:`, data.users);
});
```
