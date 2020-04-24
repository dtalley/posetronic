import { Injectable } from '@angular/core';

enum SessionRoundType {
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
          count: 5,
          duration: 2,
          type: SessionRoundType.Sketch
        },
        {
          count: 5,
          duration: 4,
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
}
