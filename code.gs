const GOOGLE_CHAT_WEBHOOK_LINK = PropertiesService.getScriptProperties().getProperty("companyChannelWebhookUrl");
const CALENDAR_ID = PropertiesService.getScriptProperties().getProperty("infolytxCalendarId");


function formatDate(date) {
  var options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}


function formatTime(date) {
  var options = { hour: 'numeric', minute: '2-digit', hour12: true };
  return date.toLocaleTimeString('en-US', options);
}


function formatDateWithDay(date) {
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}


function clearStoredEventIds() {
  // Get the current date and time
  var now = new Date();
  now.setUTCHours(now.getUTCHours() + 6);
  
  var startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 5, 55, 0);
  var endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
  
  // Check if the current time is within the specified range
  if (now >= startTime && now <= endTime) {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);

    var propertyKey = 'latestEventIds';
    
    var allEventIdsAsString = PropertiesService.getScriptProperties().getProperty(propertyKey);
    if (allEventIdsAsString != null) {
      var eventIds = allEventIdsAsString.split(',');
      for (var i = 0; i < eventIds.length; ++i) {
        var eventId = eventIds[i].trim();
        var eventTitle = calendar.getEventById(eventId).getTitle();
        console.info("(-) Deleting: " + eventTitle + " | Id: " + eventId);
      }

      PropertiesService.getScriptProperties().deleteProperty(propertyKey);
    }
  } else {
    console.info("Condition not met. Current time is not within the specified range (11:55 PM to 12:00 AM).");
  }
}

function sendNewEventsToChat() {
  var propertyKey = 'latestEventIds';

  var latestEventIds = PropertiesService.getScriptProperties().getProperty(propertyKey);
  latestEventIds = latestEventIds ? latestEventIds.split(',') : [];

  var allEvents = getNewEvents(CALENDAR_ID);

  var newEvents = allEvents.filter(function (event) {
    return !latestEventIds.includes(event.getId());
  });

  for (var i = 0; i < newEvents.length; i++) {
    var newEvent = newEvents[i];
    var newEventId = newEvent.getId();
    var newEventTitle = newEvent.getTitle();

    var message;
    if (i == 0) {
      console.info("Pushing New events in Channel");
    }
    if (newEvent.isAllDayEvent()) {
      message = '🔔 ' + '*' + newEventTitle + '*' + '\n' +
                '🗓️ ' + formatDateWithDay(newEvent.getStartTime()) + '\n' +
                '       ' + 'All Day Event' + '\n' +
                '       ' + '_via ডাকপিয়ন by Shad_ ⚡';
    } else {
      message = '🔔 ' + '*' + newEventTitle + '*' + '\n' +
                '🗓️ ' + formatDateWithDay(newEvent.getStartTime()) + '\n' +
                '       ' + formatTime(newEvent.getStartTime()) + ' - ' + formatTime(newEvent.getEndTime()) + '\n' +
                '       ' + '_via ডাকপিয়ন by Shad_ ⚡';
    }
    console.info("==>  " + "Pushing: " + newEventTitle + " | Id: " + newEventId);

    sendMessageToChat(GOOGLE_CHAT_WEBHOOK_LINK, message);
  }

  if (newEvents.length > 0) {
    var updatedEventIds = latestEventIds.concat(newEvents.map(function (event) {
      return event.getId();
    }));
    PropertiesService.getScriptProperties().setProperty(propertyKey, updatedEventIds.join(','));
  }
}


function getNewEvents(calendarId) {

  var now = new Date();

  var endDate = new Date(now);
  endDate.setHours(23, 59, 59); // Set the end time to the end of the current day

  var nowString = now.toISOString();

  var timeMin = nowString;

  var events = CalendarApp.getCalendarById(calendarId).getEvents(new Date(timeMin), endDate);

  return events;
}


function sendMessageToChat(url, message) {
  var payload = {
    text: message
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
  };

  UrlFetchApp.fetch(url, options);
}