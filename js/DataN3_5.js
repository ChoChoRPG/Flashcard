const dataString = `
稲,いね,tanaman padi,N3
居眠り,いねむり,"mengantuk, tertidur",N3
命,いのち,hidup,N3
違反,いはん,"pelanggaran (hukum), pelanggaran",N3
衣服,いふく,pakaian,N3
居間,いま,ruang tamu,N3
今に,いまに,"tidak lama lagi, segera",N3
今にも,いまにも,"kapan saja, segera",N3
イメージ,イメージ,citra seseorang,N3
否,いや,"tidak, yang tidak",N3
以来,いらい,"sejak, selanjutnya",N3
依頼,いらい,permintaan; ketergantungan,N3
いらいら,いらいら,"menjadi gugup, iritasi",N3
いらっしゃい,いらっしゃい,selamat datang,N3
医療,いりょう,"perawatan medis, pengobatan medis",N3
岩,いわ,batu,N3
祝い,いわい,"perayaan, festival",N3
祝う,いわう,"mengucapkan selamat, merayakan",N3
言わば,いわば,ibaratnya,N3
いわゆる,いわゆる,"yang disebut, ibaratnya",N3
インク,インク,tinta,N3
印刷,いんさつ,pencetakan,N3
印象,いんしょう,kesan,N3
引退,いんたい,pensiun,N3
インタビュー,インタビュー,wawancara,N3
引用,いんよう,"kutipan, sitasi",N3
ウイスキー,ウイスキー,wiski,N3
上,うわ,"atas, luar, permukaan",N3
魚,うお,ikan,N3
うがい,うがい,berkumur,N3
受け取る,うけとる,"menerima, mendapatkan, menerima",N3
動かす,うごかす,"memindahkan, menggeser",N3
兎,うさぎ,"kelinci",N3
牛,うし,"sapi, lembu",N3
失う,うしなう,"kehilangan, berpisah dengan",N3
疑う,うたがう,"meragukan, tidak percaya",N3
宇宙,うちゅう,"alam semesta, kosmos, angkasa",N3
討つ,うつ,"menyerang, membalas dendam",N3
撃つ,うつ,"menyerang, menembak",N3
うっかり,うっかり,dengan ceroboh; secara tidak sengaja,N3
映す,うつす,"memproyeksikan, memantulkan, melemparkan (bayangan)",N3
訴える,うったえる,"mengeluh, mengajukan banding, menuntut (seseorang)",N3
写る,うつる,"difoto, diproyeksikan",N3
映る,うつる,"terpantul, keluar (foto)",N3
うなる,うなる,"mengerang, merintih",N3
奪う,うばう,"merampok, merampas",N3
馬,うま,kuda; uskup yang dipromosikan (dalam catur Jepang yang dikenal sebagai shogi),N3
生まれ,うまれ,"kelahiran, tempat lahir",N3
有無,うむ,"ya atau tidak, ada atau tidaknya",N3
梅,うめ,"prem, terendah (dari sistem peringkat tiga tingkat)",N3
埋める,うめる,"mengubur, mengisi, mengisi (kursi, posisi kosong)",N3
裏切る,うらぎる,"mengkhianati, menjadi pengkhianat",N3
羨ましい,うらやましい,"iri, patut ditiru",N3
売れる,うれる,terjual,N3
噂,うわさ,"rumor, gosip",N3
運,うん,"keberuntungan, nasib",N3
運転,うんてん,"operasi, mengemudi",N3
柄,え,"pegangan (pedang, belati, dll.), gagang",N3
永遠,えいえん,"keabadian, kekekalan, keabadian",N3
永久,えいきゅう,"keabadian, kekekalan, keabadian",N3
影響,えいきょう,"pengaruh, efek",N3
営業,えいぎょう,"bisnis, perdagangan, manajemen",N3
衛星,えいせい,satelit,N3
栄養,えいよう,"nutrisi, gizi",N3
笑顔,えがお,senyum (di wajah seseorang),N3
描く,えがく,"menggambar, melukiskan, mendeskripsikan",N3
餌,えさ,"pakan, umpan",N3
エネルギー,エネルギー,energi (JER: energie),N3
得る,える,"mendapatkan, memperoleh, memenangkan, belajar",N3
得る,うる,"mendapatkan, memperoleh, memenangkan",N3
円,えん,"lingkaran, yen",N3
延期,えんき,"penundaan, penundaan",N3
演技,えんぎ,"akting, pertunjukan",N3
援助,えんじょ,"bantuan, pertolongan, dukungan",N3
エンジン,エンジン,mesin,N3
演説,えんぜつ,"pidato, pidato",N3
演奏,えんそう,pertunjukan musik,N3
老い,おい,"usia tua, orang tua",N3
追い付く,おいつく,"menyalip, mengejar (dengan)",N3
王,おう,raja,N3
追う,おう,"mengejar, mengejar",N3
応援,おうえん,"bantuan, pertolongan, bantuan",N3
王様,おうさま,raja,N3
王子,おうじ,pangeran,N3
応じる,おうじる,"beradaptasi, menanggapi, mematuhi",N3
横断,おうだん,menyeberang,N3
終える,おえる,menyelesaikan,N3
大いに,おおいに,"banyak, sangat (sama dengan 大変 (たいへん)), sangat",N3
覆う,おおう,"menutupi, menyembunyikan, menutupi",N3
大家,おおや,tuan tanah,N3
丘,おか,"bukit, ketinggian",N3
沖,おき,laut lepas,N3
奥,おく,"interior, bagian dalam",N3
贈る,おくる,"menghadiahkan, memberikan kepada, menganugerahkan kepada",N3
起こる,おこる,"terjadi, terjadi",N3
押える,おさえる,"menghentikan, menahan, menekan",N3
幼い,おさない,"sangat muda, kekanak-kanakan",N3
収める,おさめる,"menyimpan untuk membayar, memasok",N3
納める,おさめる,"menyimpan untuk membayar, memasok",N3
治める,おさめる,"memerintah, mengelola; menaklukkan",N3
お辞儀,おじぎ,membungkuk,N3
お洒落,おしゃれ,"berpakaian rapi, sadar mode",N3
`;