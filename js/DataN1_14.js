const dataString = `
主任,しゅにん,"penanggung jawab, pejabat yang bertanggung jawab",N1
首脳,しゅのう,"kepala, pemimpin",N1
守備,しゅび,pertahanan,N1
手法,しゅほう,teknik,N1
樹木,じゅもく,"pohon dan semak, punjung",N1
樹立,じゅりつ,"mendirikan, menciptakan",N1
準急,じゅんきゅう,"ekspres lokal (kereta, lebih lambat dari ekspres)",N1
準じる,じゅんじる,"mengikuti, menyesuaikan diri, berlaku untuk",N1
～署,～しょ,departemen,N1
～症,～しょう,penyakit,N1
～証,～しょう,"bukti, sertifikat",N1
～嬢,～じょう,wanita muda,N1
上位,じょうい,"unggul, tingkat yang lebih tinggi",N1
上演,じょうえん,pertunjukan seni,N1
城下,じょうか,tanah dekat kastil,N1
消去,しょうきょ,"penghapusan, penghapusan",N1
上空,じょうくう,"langit, langit ketinggian tinggi, udara atas",N1
衝撃,しょうげき,"kejutan, tabrakan, benturan, balistik",N1
証言,しょうげん,"bukti, kesaksian",N1
証拠,しょうこ,"bukti, bukti",N1
照合,しょうごう,"pemeriksaan, verifikasi",N1
詳細,しょうさい,"detail, keterangan",N1
上昇,じょうしょう,"naik, menanjak, mendaki",N1
昇進,しょうしん,promosi,N1
称する,しょうする,"mengambil nama, menyebut diri sendiri",N1
情勢,じょうせい,"keadaan, kondisi, situasi",N1
消息,しょうそく,"berita, surat, keadaan",N1
承諾,しょうだく,"persetujuan, persetujuan",N1
情緒,じょうちょ,"emosi, perasaan",N1
情緒,じょうしょ,"emosi, perasaan",N1
象徴,しょうちょう,simbol,N1
小児科,しょうにか,pediatri,N1
使用人,しようにん,"karyawan, pelayan",N1
情熱,じょうねつ,"gairah, antusiasme, semangat",N1
譲歩,じょうほ,"konsesi, konsiliasi, kompromi",N1
条約,じょうやく,"perjanjian, pakta",N1
勝利,しょうり,"kemenangan, kemenangan, menang",N1
上陸,じょうりく,"pendaratan, turun dari kapal",N1
蒸溜,じょうりゅう,distilasi,N1
奨励,しょうれい,"dorongan, promosi",N1
ショー,ショー,pertunjukan,N1
除外,じょがい,"pengecualian, pengecualian",N1
職員,しょくいん,"anggota staf, personel",N1
植民地,しょくみんち,koloni,N1
職務,しょくむ,tugas profesional,N1
諸君,しょくん,"Tuan-tuan!, Nyonya-nyonya!",N1
助言,じょげん,"nasihat, saran",N1
徐行,じょこう,berjalan pelan,N1
所在,しょざい,keberadaan,N1
所持,しょじ,"kepemilikan, memiliki",N1
所属,しょぞく,"terikat pada, milik",N1
処置,しょち,perawatan,N1
しょっちゅう,しょっちゅう,"selalu, terus-menerus",N1
所定,しょてい,"tetap, ditentukan",N1
所得,しょとく,pendapatan,N1
処罰,しょばつ,hukuman,N1
初版,しょはん,edisi pertama,N1
書評,しょひょう,ulasan buku,N1
処分,しょぶん,"pembuangan, penanganan, hukuman",N1
庶民,しょみん,"massa, rakyat jelata",N1
庶務,しょむ,urusan umum,N1
所有,しょゆう,"milik seseorang, kepemilikan",N1
調べ,しらべ,"penyelidikan, inspeksi",N1
自立,じりつ,"kemerdekaan, kemandirian",N1
記す,しるす,"mencatat, menulis",N1
指令,しれい,"perintah, instruksi, arahan",N1
～心,～しん,pikiran ~,N1
陣,じん,"formasi pertempuran, kamp, ​​perkemahan",N1
進化,しんか,"evolusi, kemajuan",N1
人格,じんかく,"kepribadian, karakter",N1
審議,しんぎ,musyawarah,N1
新婚,しんこん,pengantin baru,N1
審査,しんさ,"penilaian, inspeksi, pemeriksaan",N1
人材,じんざい,orang berbakat,N1
紳士,しんし,tuan-tuan,N1
真実,しんじつ,"kebenaran, kenyataan",N1
信者,しんじゃ,"orang percaya, pemuja",N1
真珠,しんじゅ,mutiara,N1
進出,しんしゅつ,kemajuan,N1
心情,しんじょう,mentalitas,N1
新人,しんじん,"wajah baru, pendatang baru",N1
神聖,しんせい,"kesucian, kesakralan, martabat",N1
親善,しんぜん,persahabatan,N1
真相,しんそう,"kebenaran, situasi sebenarnya",N1
迅速,じんそく,"cepat, cepat, cepat",N1
人体,じんたい,tubuh manusia,N1
新築,しんちく,"bangunan baru, konstruksi baru",N1
心中,しんじゅう,bunuh diri ganda,N1
進呈,しんてい,presentasi,N1
進展,しんてん,"kemajuan, perkembangan",N1
神殿,しんでん,"kuil, tempat suci",N1
進度,しんど,kemajuan,N1
振動,しんどう,"osilasi, getaran",N1
新入生,しんにゅうせい,"siswa baru, siswa tahun pertama, mahasiswa baru",N1
信任,しんにん,"kepercayaan, keyakinan, kepercayaan",N1
神秘,しんぴ,misteri,N1
辛抱,しんぼう,"kesabaran, daya tahan",N1
人民,じんみん,"rakyat, publik",N1
侵略,しんりゃく,"agresi, invasi, serangan",N1
診療,しんりょう,pemeriksaan dan perawatan medis,N1
`;