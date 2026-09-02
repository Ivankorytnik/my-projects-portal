package pro.korytnikhub.photomail

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Patterns
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : Activity() {
    private lateinit var emailSpinner: Spinner
    private lateinit var newEmail: EditText
    private lateinit var saveEmailButton: Button
    private lateinit var deleteEmailButton: Button
    private lateinit var takePhotoButton: Button
    private lateinit var progress: ProgressBar
    private lateinit var statusText: TextView

    private lateinit var settingsToggleButton: Button
    private lateinit var settingsPanel: LinearLayout
    private lateinit var senderEmail: EditText
    private lateinit var senderPassword: EditText
    private lateinit var smtpHost: EditText
    private lateinit var smtpPort: EditText
    private lateinit var saveSenderButton: Button

    private val prefs by lazy { getSharedPreferences("photo_mail", MODE_PRIVATE) }
    private val secureStore by lazy { SecureStore(this) }
    private val recipients = mutableListOf<String>()
    private var currentPhotoUri: Uri? = null
    private var currentFileName: String = "photo.jpg"
    private val requestPhoto = 1001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        emailSpinner = findViewById(R.id.emailSpinner)
        newEmail = findViewById(R.id.newEmail)
        saveEmailButton = findViewById(R.id.saveEmailButton)
        deleteEmailButton = findViewById(R.id.deleteEmailButton)
        takePhotoButton = findViewById(R.id.takePhotoButton)
        progress = findViewById(R.id.progress)
        statusText = findViewById(R.id.statusText)

        settingsToggleButton = findViewById(R.id.settingsToggleButton)
        settingsPanel = findViewById(R.id.settingsPanel)
        senderEmail = findViewById(R.id.senderEmail)
        senderPassword = findViewById(R.id.senderPassword)
        smtpHost = findViewById(R.id.smtpHost)
        smtpPort = findViewById(R.id.smtpPort)
        saveSenderButton = findViewById(R.id.saveSenderButton)

        loadRecipients()
        refreshRecipientSpinner()
        loadSenderSettings()

        saveEmailButton.setOnClickListener { addRecipient() }
        deleteEmailButton.setOnClickListener { deleteRecipient() }
        takePhotoButton.setOnClickListener { startCamera() }
        saveSenderButton.setOnClickListener { saveSenderSettings() }
        settingsToggleButton.setOnClickListener {
            settingsPanel.visibility = if (settingsPanel.visibility == View.VISIBLE) View.GONE else View.VISIBLE
        }

        if (!isSenderConfigured()) {
            settingsPanel.visibility = View.VISIBLE
            statusText.text = "Сначала настройте почту отправителя"
        }
    }

    private fun loadRecipients() {
        val saved = prefs.getString("recipients", "").orEmpty()
        recipients.clear()
        recipients.addAll(saved.split("|").map { it.trim() }.filter { it.isNotBlank() }.distinct())
    }

    private fun persistRecipients() {
        prefs.edit().putString("recipients", recipients.joinToString("|")).apply()
    }

    private fun refreshRecipientSpinner(select: String? = null) {
        val display = if (recipients.isEmpty()) listOf("Сначала добавьте email") else recipients
        emailSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, display)
        val preferred = select ?: prefs.getString("last_recipient", null)
        val index = recipients.indexOf(preferred)
        if (index >= 0) emailSpinner.setSelection(index)
    }

    private fun addRecipient() {
        val email = newEmail.text.toString().trim().lowercase(Locale.ROOT)
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            toast("Введите корректный email")
            return
        }
        if (!recipients.contains(email)) recipients.add(email)
        persistRecipients()
        prefs.edit().putString("last_recipient", email).apply()
        refreshRecipientSpinner(email)
        newEmail.text.clear()
        statusText.text = "Адрес сохранен"
    }

    private fun deleteRecipient() {
        if (recipients.isEmpty()) return
        val email = emailSpinner.selectedItem?.toString() ?: return
        recipients.remove(email)
        persistRecipients()
        if (prefs.getString("last_recipient", null) == email) {
            prefs.edit().remove("last_recipient").apply()
        }
        refreshRecipientSpinner()
        statusText.text = "Адрес удален"
    }

    private fun selectedRecipient(): String? {
        if (recipients.isEmpty()) return null
        val value = emailSpinner.selectedItem?.toString().orEmpty()
        return value.takeIf { Patterns.EMAIL_ADDRESS.matcher(it).matches() }
    }

    private fun loadSenderSettings() {
        senderEmail.setText(prefs.getString("sender_email", ""))
        smtpHost.setText(prefs.getString("smtp_host", ""))
        smtpPort.setText(prefs.getInt("smtp_port", 465).toString())
        if (secureStore.hasPassword()) senderPassword.hint = "Пароль приложения сохранен"
    }

    private fun guessHost(email: String): String = when {
        email.endsWith("@gmail.com") -> "smtp.gmail.com"
        email.endsWith("@yandex.ru") || email.endsWith("@yandex.com") || email.endsWith("@ya.ru") -> "smtp.yandex.ru"
        email.endsWith("@mail.ru") || email.endsWith("@bk.ru") || email.endsWith("@inbox.ru") || email.endsWith("@list.ru") -> "smtp.mail.ru"
        else -> ""
    }

    private fun saveSenderSettings() {
        val email = senderEmail.text.toString().trim().lowercase(Locale.ROOT)
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            toast("Введите корректную почту отправителя")
            return
        }

        var host = smtpHost.text.toString().trim()
        if (host.isBlank()) host = guessHost(email)
        if (host.isBlank()) {
            toast("Укажите SMTP сервер")
            return
        }

        val port = smtpPort.text.toString().trim().toIntOrNull()
        if (port != 465) {
            toast("В этой версии используйте защищенный SMTP порт 465")
            return
        }

        val newPassword = senderPassword.text.toString()
        if (newPassword.isNotBlank()) {
            secureStore.savePassword(newPassword)
        } else if (!secureStore.hasPassword()) {
            toast("Введите пароль приложения")
            return
        }

        prefs.edit()
            .putString("sender_email", email)
            .putString("smtp_host", host)
            .putInt("smtp_port", port)
            .apply()

        senderEmail.setText(email)
        smtpHost.setText(host)
        senderPassword.text.clear()
        senderPassword.hint = "Пароль приложения сохранен"
        settingsPanel.visibility = View.GONE
        statusText.text = "Почта отправителя настроена"
    }

    private fun isSenderConfigured(): Boolean {
        return !prefs.getString("sender_email", "").isNullOrBlank() &&
            !prefs.getString("smtp_host", "").isNullOrBlank() &&
            secureStore.hasPassword()
    }

    private fun senderSettings(): SmtpSender.Settings? {
        val email = prefs.getString("sender_email", "").orEmpty()
        val host = prefs.getString("smtp_host", "").orEmpty()
        val port = prefs.getInt("smtp_port", 465)
        val password = secureStore.readPassword().orEmpty()
        if (email.isBlank() || host.isBlank() || password.isBlank()) return null
        return SmtpSender.Settings(host, port, email, password)
    }

    private fun startCamera() {
        val recipient = selectedRecipient()
        if (recipient == null) {
            toast("Сначала добавьте адрес получателя")
            return
        }
        if (!isSenderConfigured()) {
            settingsPanel.visibility = View.VISIBLE
            toast("Сначала настройте почту отправителя")
            return
        }

        prefs.edit().putString("last_recipient", recipient).apply()
        val stamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.ROOT).format(Date())
        currentFileName = "PhotoMail_$stamp.jpg"
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, currentFileName)
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/PhotoMail")
        }
        currentPhotoUri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
        val uri = currentPhotoUri
        if (uri == null) {
            toast("Не удалось создать файл для фотографии")
            return
        }

        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
            putExtra(MediaStore.EXTRA_OUTPUT, uri)
            addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        if (intent.resolveActivity(packageManager) == null) {
            toast("Камера не найдена")
            return
        }
        statusText.text = "Открываю камеру..."
        startActivityForResult(intent, requestPhoto)
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != requestPhoto) return
        if (resultCode == RESULT_OK) {
            val uri = currentPhotoUri ?: return
            val recipient = selectedRecipient() ?: return
            sendPhoto(uri, recipient, currentFileName)
        } else {
            currentPhotoUri?.let { contentResolver.delete(it, null, null) }
            currentPhotoUri = null
            statusText.text = "Съемка отменена"
        }
    }

    private fun sendPhoto(uri: Uri, recipient: String, fileName: String) {
        val settings = senderSettings()
        if (settings == null) {
            settingsPanel.visibility = View.VISIBLE
            toast("Проверьте настройку почты отправителя")
            return
        }

        setBusy(true, "Отправляю на $recipient...")
        Thread {
            try {
                val stream = contentResolver.openInputStream(uri) ?: error("Не удалось прочитать фото")
                SmtpSender.sendPhoto(settings, recipient, stream, fileName)
                setBusy(false, "Отправлено на $recipient")
            } catch (e: Exception) {
                setBusy(false, "Не отправлено: ${e.message ?: "ошибка"}")
            }
        }.start()
    }

    private fun setBusy(busy: Boolean, message: String) {
        runOnUiThread {
            progress.visibility = if (busy) View.VISIBLE else View.GONE
            takePhotoButton.isEnabled = !busy
            saveEmailButton.isEnabled = !busy
            deleteEmailButton.isEnabled = !busy
            saveSenderButton.isEnabled = !busy
            statusText.text = message
        }
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}
