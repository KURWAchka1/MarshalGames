# Поддомен play.marshalrf.ru

Предлагаемый адрес: **https://play.marshalrf.ru**.

1. В GitHub: Settings → Pages → Custom domain указать `play.marshalrf.ru` и сохранить.
2. В панели DNS домена `marshalrf.ru` добавить:

   | Тип | Имя | Значение |
   | --- | --- | --- |
   | CNAME | play | kurwachka1.github.io |

   В значении не должно быть `https://` или `/MarshalGames/`. Если панель требует полное имя, использовать `play.marshalrf.ru`. Не изменять записи самого `marshalrf.ru` или других поддоменов. Если `play` уже занят, сначала проверить его назначение.

3. Дождаться успешной DNS-проверки в GitHub Pages. Распространение DNS может занять до 24 часов.
4. Когда GitHub выдаст сертификат, включить **Enforce HTTPS**.

При публикации через GitHub Actions файл `CNAME` не требуется: домен настраивается в Settings → Pages. До переключения домена рабочий адрес — `https://kurwachka1.github.io/MarshalGames/`.

Источник: [документация GitHub](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
