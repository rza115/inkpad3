Ada bug di fitur inline margin note (Fase 11): input "Isi catatan..." di
`SelectionToolbar.tsx` muncul saat teks di-select, tapi begitu diklik dan
diketik, tidak ada karakter yang masuk ke input tersebut.

Dugaan penyebab: focus stealing dari ProseMirror. Saat toolbar berada di atas
area contentEditable, default browser behavior pada event `mousedown` di
elemen manapun yang overlap editor bisa membuat ProseMirror merebut balik
selection/fokus ke posisi klik sebelum browser sempat menaruh cursor di
dalam `<input>` toolbar — kecuali container toolbar secara eksplisit memanggil
`preventDefault()` di `onMouseDown` (bukan `onClick`) untuk mencegah itu.

Tolong:

1. Diagnosa dulu — cek apakah dugaan di atas benar dengan lihat langsung ke
   `components/editor/SelectionToolbar.tsx`: apakah container toolbar sudah
   punya `onMouseDown={(e) => e.preventDefault()}` di elemen pembungkus
   (bukan di `<input>` itu sendiri)? Kalau belum ada, itu kemungkinan besar
   akar masalahnya.

2. Cek juga apakah ada `onKeyDown` global (di level editor/document) yang
   mungkin ikut nyegat keystroke sebelum sampai ke `<input>` — misalnya
   listener keyboard shortcut ProseMirror yang tidak mengecek apakah target
   event sedang berada di dalam form/input.

3. Perbaiki dengan:
   - Tambahkan `onMouseDown={(e) => e.preventDefault()}` di elemen container
     toolbar (div pembungkus tombol "Tambah catatan" + input), supaya default
     browser behavior yang memindahkan selection balik ke editor dibatalkan.
   - Pastikan `<input>` sendiri TIDAK ikut kena `preventDefault` ini — kalau
     ikut kena, fokus malah tidak akan pernah bisa masuk ke input.
   - Kalau ada listener keyboard global di level dokumen/editor, tambahkan
     guard: skip handler itu kalau `event.target` adalah elemen
     `input`/`textarea` atau berada di dalam `SelectionToolbar` (misal cek
     `target.closest('[data-selection-toolbar]')`).

4. Setelah fix, test manual: select teks di editor → klik tombol "Tambah
   catatan" → klik ke dalam input → pastikan ada kursor berkedip di
   dalamnya → ketik teks → pastikan karakter yang diketik benar-benar masuk
   ke input, bukan hilang atau ke-drop.

5. Test regresi: pastikan setelah fix ini, fokus normal contentEditable
   (klik di teks manuskrip biasa, di luar toolbar) masih berfungsi normal —
   cursor tetap bisa ditaruh di posisi klik seperti biasa.
