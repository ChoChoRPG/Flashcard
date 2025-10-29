const dataString = `
メディア,メディア,media,N1
目途,めど,"tujuan, pandangan",N1
目盛,めもり,"skala, gradasi",N1
メロディー,メロディー,melodi,N1
面会,めんかい,wawancara,N1
免除,めんじょ,"pembebasan, pembebasan, pemecatan",N1
面する,めんする,"menghadap ke, menghadap ke",N1
面目,めんぼく,"wajah, kehormatan, reputasi",N1
面目,めんもく,"wajah, kehormatan, reputasi",N1
～網,～もう,~ jaringan,N1
設ける,もうける,"membuat, mendirikan",N1
申し入れる,もうしいれる,"mengusulkan, menyarankan",N1
申込,もうしこみ,"aplikasi, permintaan, proposal",N1
申出,もうしで,"permintaan, klaim, laporan",N1
申し出る,もうしでる,"melapor ke, memberitahu, menyarankan",N1
申し分,もうしぶん,"keberatan, kekurangan",N1
盲点,もうてん,titik buta,N1
猛烈,もうれつ,"keras, bersemangat, marah",N1
モーテル,モーテル,motel,N1
もがく,もがく,"berjuang, menggeliat, tidak sabar",N1
目録,もくろく,"katalog, daftar",N1
目論見,もくろみ,"rencana, skema, niat",N1
模型,もけい,"model, boneka, maket",N1
模索,もさく,meraba-raba (untuk),N1
もしかして,もしかして,"mungkin, barangkali",N1
もしくは,もしくは,"atau, jika tidak",N1
もたらす,もたらす,"membawa, mengambil, menyebabkan",N1
持ち切り,もちきり,"topik hangat, pembicaraan di kota",N1
目下,もっか,"saat ini, sekarang",N1
専ら,もっぱら,"sepenuhnya, semata-mata, seluruhnya",N1
もてなす,もてなす,"menghibur, menyambut",N1
もてる,もてる,"disukai, populer",N1
モニター,モニター,monitor (komputer),N1
物好き,ものずき,rasa ingin tahu (iseng),N1
物足りない,ものたりない,"tidak puas, tidak memuaskan",N1
もはや,もはや,"sudah, sekarang",N1
模範,もはん,"model, contoh",N1
模倣,もほう,"peniruan, penyalinan",N1
もめる,もめる,"tidak setuju, berselisih",N1
股,もも,"paha, tulang paha",N1
腿,もも,"paha, tulang paha",N1
催す,もよおす,"mengadakan (rapat), memberi (makan malam)",N1
漏らす,もらす,"membiarkan bocor, mengungkapkan",N1
盛り上がる,もりあがる,"membangkitkan, membengkak, naik",N1
漏る,もる,"bocor, habis",N1
漏れる,もれる,"bocor, lolos, tersaring",N1
脆い,もろい,"rapuh, rapuh, berhati lembut",N1
もろに,もろに,"sepenuhnya, sama sekali, secara badaniah",N1
矢,や,panah,N1
野外,やがい,"ladang, pinggiran kota, udara terbuka, pinggiran kota",N1
～薬,～やく,obat,N1
夜具,やぐ,perlengkapan tidur,N1
役職,やくしょく,"jabatan, posisi manajerial, posisi resmi",N1
役場,やくば,balai kota,N1
やけに,やけに,"pasti, sangat",N1
屋敷,やしき,rumah besar,N1
養う,やしなう,"memelihara, memelihara, membudidayakan",N1
野心,やしん,"ambisi, cita-cita",N1
安っぽい,やすっぽい,"terlihat murahan, norak",N1
休める,やすめる,"beristirahat, menangguhkan, memberi kelegaan",N1
野生,やせい,liar,N1
奴,やつ,"(kasar) kawan, pria, bung",N1
闇,やみ,"kegelapan, teduh, ilegal",N1
病む,やむ,"jatuh sakit, sakit",N1
ややこしい,ややこしい,"membingungkan, kusut, rumit, kompleks",N1
やりとおす,やりとおす,"melaksanakan, mencapai, menyelesaikan",N1
やりとげる,やりとげる,menyelesaikan,N1
和らげる,やわらげる,"melunakkan, meredakan, meringankan",N1
ヤング,ヤング,muda,N1
～油,～ゆ,~ minyak,N1
優位,ゆうい,"dominasi, kekuasaan, keunggulan",N1
憂鬱,ゆううつ,"depresi, melankolis",N1
有益,ゆうえき,"bermanfaat, menguntungkan",N1
優越,ゆうえつ,"supremasi, dominasi, lebih unggul dari",N1
勇敢,ゆうかん,"keberanian, kepahlawanan, kegagahan",N1
夕暮れ,ゆうぐれ,"petang, senja (petang)",N1
融資,ゆうし,"pembiayaan, pinjaman",N1
有する,ゆうする,"memiliki, diberkahi dengan",N1
優勢,ゆうせい,"keunggulan, kekuatan superior, dominasi",N1
優先,ゆうせん,"preferensi, prioritas",N1
誘導,ゆうどう,"bimbingan, memimpin, bujukan",N1
融通,ゆうずう,"kemampuan beradaptasi, fleksibilitas, keuangan",N1
優美,ゆうび,"keanggunan, kehalusan, keeleganan",N1
有望,ゆうぼう,"prospek bagus, penuh harapan, menjanjikan",N1
遊牧,ゆうぼく,nomadisme,N1
夕焼け,ゆうやけ,matahari terbenam,N1
有力,ゆうりょく,"pengaruh, keunggulan; kuat",N1
幽霊,ゆうれい,"hantu, momok, hantu",N1
誘惑,ゆうわく,"godaan, bujukan, iming-iming",N1
故,ゆえ,"alasan, sebab, keadaan",N1
歪む,ゆがむ,"melengkung, bengkok, terdistorsi",N1
揺さぶる,ゆさぶる,"mengguncang, menyentak, mengayun, mengayunkan",N1
濯ぐ,ゆすぐ,"membilas, mencuci",N1
ゆとり,ゆとり,"cadangan, kemakmuran, waktu (luang)",N1
ユニーク,ユニーク,unik,N1
ユニフォーム,ユニフォーム,seragam,N1
指差す,ゆびさす,menunjuk ke,N1
弓,ゆみ,busur,N1
揺らぐ,ゆらぐ,"bergoyang, berayun, berguncang",N1
緩む,ゆるむ,"menjadi longgar, mengendur",N1
`;