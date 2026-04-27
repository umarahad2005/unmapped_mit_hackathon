UNMAPPED — team profile photos
================================

Drop the four LinkedIn profile pictures here using these EXACT filenames
(case-sensitive on Linux deploy targets):

  umar.jpg     — Umar Ahad Usmani      (https://www.linkedin.com/in/umarahadusmani/)
  rizwan.jpg   — Hafiz Rizwan Umar     (https://www.linkedin.com/in/hafizrizwanumar/)
  zeeshan.jpg  — Zeeshan Jamal         (https://www.linkedin.com/in/zeeshan-jamal-data-scientist/)
  taimoor.jpg  — M. Taimoor Ahsan      (https://www.linkedin.com/in/taimoorxahsan/)

How to grab them
----------------
1. Open each LinkedIn profile in a browser while logged in.
2. Click the profile picture, then right-click the larger preview → "Save image as…".
3. Save to this folder with the filename above.
4. Recommended: 400 × 400 px, JPEG, ≤ 60 KB (light enough for 2G).

Why we don't auto-fetch
-----------------------
LinkedIn's CDN URLs are short-lived signed URLs and the platform blocks
hot-linking from third-party sites — they break within hours. Local files
are the only reliable approach.

Fallback behaviour
------------------
If a file is missing, the team page automatically falls back to a colored
circle showing the member's initials (UA / HR / ZJ / TA). No code change
needed when you add or remove a photo.
