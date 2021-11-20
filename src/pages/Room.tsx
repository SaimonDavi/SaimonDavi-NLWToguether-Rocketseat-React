import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router';

import logoImg from '../assets/images/logo.svg';

import { Button } from '../components/Button';
import { RoomCode } from '../components/RoomCode';
import { useAuth } from '../hooks/useAuth'
import { database } from '../services/firebase';
import { ref, push, onValue} from "firebase/database";

import '../styles/room.css';

type RoomParams = {
  id: string;
}

type FirebaseQuestions = Record<string, {
  id: string;  
  author: {
    name: string;
    avatar: string;
  }
  content: string;
  isAnswered: boolean;
  isHighLighted: boolean;
}>

type Question = {
  author: {
    name: string;
    avatar: string;
  }
  content: string;
  isAnswered: boolean;
  isHighLighted: boolean;
}

export function Room() {
  const { user } = useAuth();
  
  const params = useParams() as RoomParams;
  const roomId = params.id;

  const [newQuestion, setNewQuestion] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');

  async function handleSendQuestion(event: FormEvent) {
    event.preventDefault();

    if (newQuestion.trim() === '') {
      return;
    }

    if (!user) {
      throw new Error('You must be logged in');
    }

    const question = {
      content: newQuestion,
      author : {
        name: user.name,
        avatar: user.avatar,
      },
      isHighLighted: false,
      isAnswered: false
    };

    const roomRef = ref(database,`rooms/${roomId}/questions`);
    await push(roomRef, { ...question })

    setNewQuestion('');
  }

  useEffect(() => {
    const roomRef = ref(database,`rooms/${roomId}`);

    onValue(roomRef,(room) => {
      const databaseRoom = room.val()
      const firebaseQuestions: FirebaseQuestions = databaseRoom.questions ?? {};
      
      const parsedQuestions = Object.entries(firebaseQuestions).map(([key, value]) => { 
        return {
          id: key,
          content: value.content,
          author: value.author,
          isHighLighted: value.isHighLighted,
          isAnswered: value.isAnswered,
        } 
      })
      
      setTitle(databaseRoom.title);
      setQuestions(parsedQuestions);
      // console.log(room.val().title);
    }) 
  }, [roomId]);

  return(
    <div id="page-room">
      <header>
        <div className="content">
          <img src={logoImg} alt="Letmeask" />
          <RoomCode code={roomId}/>
        </div>
      </header>
      <main>
        <div className="room-title">
          <h1>Sala {title}</h1>
          { questions.length > 0 && <span>{questions.length} pergunta(s)</span>}
        </div>
        <form onSubmit={handleSendQuestion}>
          <textarea
            placeholder="O que você quer perguntar?"
            onChange={event => setNewQuestion(event.target.value)}
            value={newQuestion}
          />
          <div className="form-footer">
            { user ? (
              <div className="user-info">
                <img src={user.avatar} alt={user.name} />
                <span>{user.name}</span>
              </div>
            ) : (
              <span>Para enviar uma pergunta, <button>faça seu login</button>.</span>
            ) }
            <Button type="submit" disabled={!user} >Enviar pergunta</Button>
          </div>
        </form>

        {JSON.stringify(questions)}
      </main>
    </div>
  );
}