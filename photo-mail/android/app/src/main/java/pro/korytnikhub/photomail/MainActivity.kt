package pro.korytnikhub.photomail

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : Activity() {
    private lateinit var takePhotoButton: Button
    private lateinit var updateButton: Button
    private lateinit var progress: ProgressBar
    private lateinit var statusText: TextView

    private lateinit var valuationPanel: LinearLayout
    private lateinit var itemNameText: TextView
    private lateinit var marketPriceText: TextView
    private lateinit var quickPriceText: TextView
    private lateinit var buyMaxText: TextView
    private lateinit var recommendationText: TextView
    private lateinit var valuationCommentText: TextView
    private lateinit var checkNextText: TextView
    private lateinit var confidenceText: TextView

    private var currentPhotoUri: Uri? = null
    private var currentFileName: String = "photo.jpg"
    private val requestPhoto = 1001
    private val money = NumberFormat.getIntegerInstance(Locale("ru", "RU"))

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        takePhotoButton = findViewById(R.id.takePhotoButton)
        updateButton = findViewById(R.id.updateButton)
        progress = findViewById(R.id.progress)
        statusText = findViewById(R.id.statusText)

        valuationPanel = findViewById(R.id.valuationPanel)
        itemNameText = findViewById(R.id.itemNameText)
        marketPriceText = findViewById(R.id.marketPriceText)
        quickPriceText = findViewById(R.id.quickPriceText)
        buyMaxText = findViewById(R.id.buyMaxText)
        recommendationText = findViewById(R.id.recommendationText)
        valuationCommentText = findViewById(R.id.valuationCommentText)
        checkNextText = findViewById(R.id.checkNextText)
        confidenceText = findViewById(R.id.confidenceText)

        takePhotoButton.setOnClickListener { startCamera() }
        updateButton.setOnClickListener { openLatestApk() }
    }

    private fun openLatestApk() {
        val url = Uri.parse("https://korytnikhub.pro/photo-mail/download/PhotoToMail.apk?v=${System.currentTimeMillis()}")
        val intent = Intent(Intent.ACTION_VIEW, url)
        try {
            startActivity(intent)
        } catch (_: Exception) {
            toast("Не удалось открыть загрузку обновления")
        }
    }

    private fun startCamera() {
        valuationPanel.visibility = View.GONE
        val stamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.ROOT).format(Date())
        currentFileName = "PhotoMarket_$stamp.jpg"
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, currentFileName)
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/PhotoMarket")
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
            evaluatePhoto(uri)
        } else {
            currentPhotoUri?.let { contentResolver.delete(it, null, null) }
            currentPhotoUri = null
            statusText.text = "Съемка отменена"
        }
    }

    private fun evaluatePhoto(uri: Uri) {
        setBusy(true, "Распознаю предмет и проверяю рынок...")
        Thread {
            var evaluation: PhotoEvaluator.Result? = null
            var evaluationError: String? = null

            try {
                evaluation = PhotoEvaluator.evaluate(contentResolver, uri)
            } catch (e: Exception) {
                evaluationError = e.message ?: "ошибка оценки"
            }

            runOnUiThread {
                setBusyUi(false)
                if (evaluation != null) {
                    showValuation(evaluation!!)
                    statusText.text = "Оценка готова"
                } else {
                    valuationPanel.visibility = View.GONE
                    statusText.text = "Оценка недоступна: ${evaluationError ?: "ошибка"}"
                }
            }
        }.start()
    }

    private fun showValuation(r: PhotoEvaluator.Result) {
        valuationPanel.visibility = View.VISIBLE
        itemNameText.text = r.itemName + if (r.category.isNotBlank()) " · ${r.category}" else ""
        marketPriceText.text = "Рынок: ${range(r.marketLow, r.marketHigh)}"
        quickPriceText.text = "Быстрая продажа: ${range(r.quickSaleLow, r.quickSaleHigh)}"
        buyMaxText.text = "Для перепродажи брать до: ${rub(r.buyMax)}"
        recommendationText.text = "Рекомендация: ${r.recommendation}"

        val visible = r.visibleCondition.takeIf { it.isNotBlank() }
        val comment = r.comment.takeIf { it.isNotBlank() }
        valuationCommentText.text = listOfNotNull(visible, comment).joinToString("\n")
        valuationCommentText.visibility = if (valuationCommentText.text.isNullOrBlank()) View.GONE else View.VISIBLE

        checkNextText.text = if (r.checkNext.isNotBlank()) "Что проверить: ${r.checkNext}" else ""
        checkNextText.visibility = if (r.checkNext.isBlank()) View.GONE else View.VISIBLE
        confidenceText.text = "Уверенность оценки: ${r.confidence}% · цена ориентировочная"
    }

    private fun range(low: Int?, high: Int?): String {
        if (low == null && high == null) return "недостаточно данных"
        if (low != null && high != null) return "${rub(low)}–${rub(high)}"
        return rub(low ?: high)
    }

    private fun rub(value: Int?): String = value?.let { "${money.format(it)} ₽" } ?: "—"

    private fun setBusy(busy: Boolean, message: String) {
        runOnUiThread {
            setBusyUi(busy)
            statusText.text = message
        }
    }

    private fun setBusyUi(busy: Boolean) {
        progress.visibility = if (busy) View.VISIBLE else View.GONE
        takePhotoButton.isEnabled = !busy
        updateButton.isEnabled = !busy
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}
