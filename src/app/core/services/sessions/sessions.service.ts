import { Injectable } from '@angular/core';

export enum SessionRoundType {
  Sketch,
  Rest
}

@Injectable({
  providedIn: 'root'
})
export class SessionsService {
  sessions = [
    {
      id: "standard",
      name: "Standard",
      rounds: [
        {
          count: 4,
          duration: 60,
          type: SessionRoundType.Sketch
        },
        {
          count: 2,
          duration: 120,
          type: SessionRoundType.Sketch
        },
        {
          count: 1,
          duration: 300,
          type: SessionRoundType.Sketch
        },
        {
          count: 1,
          duration: 60,
          type: SessionRoundType.Rest
        },
        {
          count: 1,
          duration: 300,
          type: SessionRoundType.Sketch
        }
      ]
    },
    {
      id: "gesture",
      name: "Gesture",
      rounds: [
        {
          count: 10,
          duration: 30,
          type: SessionRoundType.Sketch
        },
        {
          count: 6,
          duration: 120,
          type: SessionRoundType.Sketch
        }
      ]
    }
  ];
  
  getSessions() {
    return this.sessions;
  }

  getSession(id: string) {
    let result = {}
    this.sessions.forEach(session => {
      if(session.id == id) {
        result = session
        return
      }
    })
    return result
  }

  activeSessionFolder: string

  setActiveSessionFolder(newFolder: string): void {
    this.activeSessionFolder = newFolder
  }

  getActiveSessionFolder() {
    return this.activeSessionFolder
  }

  formatDuration(duration) {
    let hours = Math.floor(duration / (60 * 60))
    duration -= hours * 60 * 60;
    let minutes = Math.floor(duration / 60);
    duration -= minutes * 60;
    if(hours < 2) {
      minutes += hours * 60;
      hours = 0;
    }
    if(minutes < 2 && hours == 0) {
      duration += minutes * 60;
      minutes = 0;
    }
    
    return (hours>0?hours+"h ":"") + (minutes>0?minutes+"m ":"") + (duration>0?duration+"s":"");
  }
}
