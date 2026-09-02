package pro.korytnikhub.photomail

import android.util.Base64
import java.io.BufferedReader
import java.io.BufferedWriter
import java.io.InputStream
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import javax.net.ssl.SSLSocket
import javax.net.ssl.SSLSocketFactory

object SmtpSender {
    data class Settings(
        val host: String,
        val port: Int,
        val username: String,
        val password: String
    )

    fun sendPhoto(settings: Settings, recipient: String, photo: InputStream, fileName: String) {
        val socket = (SSLSocketFactory.getDefault() as SSLSocketFactory)
            .createSocket(settings.host, settings.port) as SSLSocket
        socket.soTimeout = 45_000
        socket.startHandshake()

        val reader = BufferedReader(InputStreamReader(socket.inputStream, Charsets.UTF_8))
        val writer = BufferedWriter(OutputStreamWriter(socket.outputStream, Charsets.UTF_8))

        fun readResponse(vararg expected: Int): Int {
            var lastCode = -1
            while (true) {
                val line = reader.readLine() ?: error("SMTP: соединение закрыто сервером")
                if (line.length < 3) continue
                val code = line.substring(0, 3).toIntOrNull() ?: continue
                lastCode = code
                val more = line.length > 3 && line[3] == '-'
                if (!more) break
            }
            if (expected.isNotEmpty() && expected.none { it == lastCode }) {
                error("SMTP: сервер вернул код $lastCode")
            }
            return lastCode
        }

        fun command(text: String, vararg expected: Int) {
            writer.write(text)
            writer.write("\r\n")
            writer.flush()
            readResponse(*expected)
        }

        fun b64(value: String): String =
            Base64.encodeToString(value.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)

        try {
            readResponse(220)
            command("EHLO android-photomail", 250)
            command("AUTH LOGIN", 334)
            command(b64(settings.username), 334)
            command(b64(settings.password), 235)
            command("MAIL FROM:<${settings.username}>", 250)
            command("RCPT TO:<$recipient>", 250, 251)
            command("DATA", 354)

            val boundary = "----PhotoMail${UUID.randomUUID()}"
            val subject = b64("Фото с телефона")
            val body = b64("Фотография автоматически отправлена приложением «Фото на почту».")
            val date = SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss Z", Locale.US).format(Date())

            writer.write("From: <${settings.username}>\r\n")
            writer.write("To: <$recipient>\r\n")
            writer.write("Date: $date\r\n")
            writer.write("Subject: =?UTF-8?B?$subject?=\r\n")
            writer.write("MIME-Version: 1.0\r\n")
            writer.write("Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n")
            writer.write("\r\n")
            writer.write("--$boundary\r\n")
            writer.write("Content-Type: text/plain; charset=UTF-8\r\n")
            writer.write("Content-Transfer-Encoding: base64\r\n\r\n")
            body.chunked(76).forEach { writer.write(it + "\r\n") }
            writer.write("\r\n--$boundary\r\n")
            writer.write("Content-Type: image/jpeg; name=\"$fileName\"\r\n")
            writer.write("Content-Disposition: attachment; filename=\"$fileName\"\r\n")
            writer.write("Content-Transfer-Encoding: base64\r\n\r\n")
            writer.flush()

            val buffer = ByteArray(57)
            while (true) {
                val read = photo.read(buffer)
                if (read <= 0) break
                val encoded = Base64.encodeToString(buffer.copyOf(read), Base64.NO_WRAP)
                writer.write(encoded)
                writer.write("\r\n")
            }

            writer.write("\r\n--$boundary--\r\n")
            writer.write(".\r\n")
            writer.flush()
            readResponse(250)
            command("QUIT", 221)
        } finally {
            runCatching { photo.close() }
            runCatching { socket.close() }
        }
    }
}
