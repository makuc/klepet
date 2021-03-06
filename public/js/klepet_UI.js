function divElementEnostavniTekst(sporocilo) {
  var jeSlika = sporocilo.indexOf('http://') > -1 || sporocilo.indexOf('https://') > -1;
  if (jeSlika) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
    sporocilo = pokaziSlike(sporocilo);
    sporocilo = pokaziYoutube(sporocilo);
    
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  
  sporocilo = dodajSmeske(sporocilo);
  
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('dregljaj', function (sporocilo) {
    $('#vsebina').jrumble({
    	x: 2,
    	y: 2,
    	rotation: 1
    });
    $('#vsebina').trigger('startRumble');
    setTimeout(function() {
      //do something special
      $('#vsebina').trigger('stopRumble');
    }, 1500);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }

    $('#seznam-uporabnikov div').click(function() {
      document.querySelector('#poslji-sporocilo').value = '/zasebno \"' + $(this).text() + "\" ";
      $('#poslji-sporocilo').focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      " http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + " ");
  }
  return vhodnoBesedilo;
}
function pokaziYoutube(vhodnoBesedilo) {
  var i = vhodnoBesedilo.indexOf("https://www.youtube.com/watch?v=");
  
  // Dodaj v output ves tekst
  var output = vhodnoBesedilo;
  // Dodano
  
  vhodnoBesedilo = vhodnoBesedilo.replace("</p>", "");
  while (i > -1)
  {
    var iEnd = vhodnoBesedilo.indexOf(" ", (i+1));
    if(iEnd == -1)
      iEnd = vhodnoBesedilo.length;
    
    var id = vhodnoBesedilo.substring(i+32, iEnd);
    
    if(id.length > 7 && id.length < 15)
    {
      output += "<iframe src='https://www.youtube.com/embed/" + id + "' width='200' height='150' style='margin-left: 20px;' allowfullscreen></iframe>";
    }
    // Odstrani že obdelan del besedila
    vhodnoBesedilo = vhodnoBesedilo.replace(vhodnoBesedilo.substring(0, iEnd), "");
    
    i = vhodnoBesedilo.indexOf("https://www.youtube.com/watch?v=");
  }
  
  return output;
}
function pokaziSlike(vhodnoBesedilo) {
  var i = vhodnoBesedilo.indexOf("http://");
  var is = vhodnoBesedilo.indexOf("https://");
  
  var output = "<p>" + vhodnoBesedilo + " </p>";
  
  var updated = false;
  
  while (i > -1 || is > -1)
  {// preglej vse zahteve začenši s "http://"
    if((i > is && is != -1) || i == -1)
      i = is;
    
    var iEnd = vhodnoBesedilo.indexOf(" ", (i+1));
    if(iEnd == -1)
      iEnd = vhodnoBesedilo.length;
    var link = vhodnoBesedilo.substring(i, iEnd);
    
    var last4chars = link.substr((link.length-4) , 4);
    
    if(last4chars == '.jpg' || last4chars == '.gif' || last4chars == '.png')
    {
      if(link.indexOf("http://sandbox.lavbic.net/teaching/OIS/gradivo/") > -1)
        output = output.replace(link, "<img src='" + link + "' />");
      else {
        if(!updated)
          output += "<br>";
        output += "<a href='" + link + "'><img src='" + link + "' width='200' style='margin-left:20px;' /></a>";
      }
      updated = true;
    }
    // Odstrani že obdelan del besedila
    vhodnoBesedilo = vhodnoBesedilo.replace(vhodnoBesedilo.substring(0, iEnd), "");
    
    i = vhodnoBesedilo.indexOf("http://");
    is = vhodnoBesedilo.indexOf("https://");
  }
  return output;
}