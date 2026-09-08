package pro.korytnikhub.photomail

import android.content.ContentResolver
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL

object PhotoEvaluator {
    private const val ENDPOINT = "https://ytdacypygsfalkixhemj.supabase.co/functions/v1/photo-market-evaluator"
    private const val APP_KEY = "KHubPhotoMarket_2026_v1_R7m9Q2x4"

    data class Result(
        val itemName: String,
        val category: String,
        val visibleCondition: String,
        val marketLow: Int?,
        val marketHigh: Int?,
        val quickSaleLow: Int?,
        val quickSaleHigh: Int?,
        val buyMax: Int?,
        val recommendation: String,
        val confidence: Int,
        val comment: String,
        val checkNext: String
    )

    fun evaluate(contentResolver: ContentResolver, uri: Uri): Result {
        val imageBase64 = prepareImage(contentResolver, uri)
        val payload = JSONObject().apply {
            put("image_base64", imageBase64)
            put("mime_type", "image/jpeg")
        }

        val connection = (URL(ENDPOINT).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15_000
            readTimeout = 35_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("x-photo-app-key", APP_KEY)
        }

        try {
            connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            val root = JSONObject(text.ifBlank { "{}" })
            if (code !in 200..299 || !root.optBoolean("ok", false)) {
                val message = root.optString("error").ifBlank { "Ошибка AI-оценки ($code)" }
                error(message)
            }

            val r = root.getJSONObject("result")
            return Result(
                itemName = r.optString("item_name", "Предмет"),
                category = r.optString("category", ""),
                visibleCondition = r.optString("visible_condition", ""),
                marketLow = nullableInt(r, "market_low"),
                marketHigh = nullableInt(r, "market_high"),
                quickSaleLow = nullableInt(r, "quick_sale_low"),
                quickSaleHigh = nullableInt(r, "quick_sale_high"),
                buyMax = nullableInt(r, "buy_max"),
                recommendation = r.optString("recommendation", "НУЖНЫ ДЕТАЛИ"),
                confidence = r.optInt("confidence", 0).coerceIn(0, 100),
                comment = r.optString("comment", ""),
                checkNext = r.optString("check_next", "")
            )
        } finally {
            connection.disconnect()
        }
    }

    private fun nullableInt(obj: JSONObject, key: String): Int? {
        if (!obj.has(key) || obj.isNull(key)) return null
        return obj.optInt(key).takeIf { it >= 0 }
    }

    private fun prepareImage(contentResolver: ContentResolver, uri: Uri): String {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) error("Не удалось прочитать фото")

        val maxSide = 1280
        var sample = 1
        while (bounds.outWidth / sample > maxSide * 2 || bounds.outHeight / sample > maxSide * 2) sample *= 2

        val options = BitmapFactory.Options().apply { inSampleSize = sample }
        val bitmap = contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }
            ?: error("Не удалось открыть фото")
        val scaled = scaleDown(bitmap, maxSide)
        if (scaled !== bitmap) bitmap.recycle()

        return try {
            val out = ByteArrayOutputStream()
            scaled.compress(Bitmap.CompressFormat.JPEG, 78, out)
            Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
        } finally {
            scaled.recycle()
        }
    }

    private fun scaleDown(bitmap: Bitmap, maxSide: Int): Bitmap {
        val w = bitmap.width
        val h = bitmap.height
        val side = maxOf(w, h)
        if (side <= maxSide) return bitmap
        val ratio = maxSide.toFloat() / side.toFloat()
        return Bitmap.createScaledBitmap(bitmap, (w * ratio).toInt(), (h * ratio).toInt(), true)
    }
}
