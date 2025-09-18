import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

const EnqueteDetail = () => {
    const { id } = useParams();
    const [enquete, setEnquete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOption, setSelectedOption] = useState(null);

    const updateEnqueteState = useCallback((updatedOpcoes) => {
        setEnquete(prevEnquete => {
            if (!prevEnquete) return null;
            const opcoesMap = new Map(updatedOpcoes.map(op => [op.id, op.votos]));
            const newOpcoes = prevEnquete.opcoes.map(op => ({
                ...op,
                votos: opcoesMap.get(op.id) ?? op.votos,
            }));
            return { ...prevEnquete, opcoes: newOpcoes };
        });
    }, []);


    useEffect(() => {
        axios.get(`${API_URL}/enquetes/${id}`)
            .then(response => {
                setEnquete(response.data);
            })
            .catch(err => {
                setError('Não foi possível carregar a enquete.');
                console.error(err);
            })
            .finally(() => setLoading(false));

        const socket = io(SOCKET_URL);
        socket.emit('join_enquete', id);
        socket.on('atualizacao_votos', (novosResultados) => {
            console.log("Votos atualizados recebidos!", novosResultados);
            updateEnqueteState(novosResultados);
        });

        return () => {
            socket.disconnect();
        };
    }, [id, updateEnqueteState]);


    const handleVote = () => {
        if (!selectedOption) {
            alert("Por favor, selecione uma opção para votar.");
            return;
        }
        axios.post(`${API_URL}/opcoes/${selectedOption}/votar`)
            .catch(err => alert(err.response?.data?.message || 'Ocorreu um erro ao votar.'));
    };

    if (loading) return <p>A carregar detalhes da enquete...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!enquete) return <p>Enquete não encontrada.</p>;

    const agora = new Date();
    const isAtiva = new Date(enquete.data_inicio) <= agora && agora <= new Date(enquete.data_fim);

    return (
        <div className="enquete-detail-container">
            <Link to="/" className="back-link">← Voltar para a lista</Link>
            <div className="enquete-header">
                <h2>{enquete.titulo}</h2>
                <p>
                    Votação de {new Date(enquete.data_inicio).toLocaleString('pt-PT')} até {new Date(enquete.data_fim).toLocaleString('pt-PT')}
                </p>
            </div>

            <div className="opcoes-container">
                <fieldset disabled={!isAtiva} className="opcoes-fieldset">
                    <legend>{isAtiva ? "Escolha uma opção e vote:" : "Votação não está ativa."}</legend>
                    {enquete.opcoes.map(opcao => (
                        <div className="opcao-item" key={opcao.id}>
                            <input
                                type="radio"
                                id={`opcao-${opcao.id}`}
                                name="votacao"
                                value={opcao.id}
                                onChange={(e) => setSelectedOption(e.target.value)}
                                checked={selectedOption === String(opcao.id)}
                            />
                            <label htmlFor={`opcao-${opcao.id}`}>{opcao.descricao}</label>
                            <span className="votos-count">{opcao.votos} votos</span>
                        </div>
                    ))}
                </fieldset>
            </div>

            {isAtiva && (
                <button onClick={handleVote} className="vote-button" disabled={!selectedOption}>
                    Votar
                </button>
            )}
        </div>
    );
};

export default EnqueteDetail;
