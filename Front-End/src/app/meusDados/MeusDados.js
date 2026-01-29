import icons from "../../components/Icons";
import { useState, useEffect } from "react";
import './MeusDados.css'

function MeusDados() {
    const [editando, setEditando] = useState(false);
    const [userData, setUserData] = useState({
    social_name: "",
    email: "",
    cpf_cnpj: "",
    telefone: "",
    tipo_pessoa: ""
    });
    const [backupData, setBackupData] = useState(null);


    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setUserData({
            social_name: user.social_name || "Usuário",
            email: user.email || "",
            cpf_cnpj: user.cpf_cnpj || "",
            telefone: user.telefone || "",
            tipo_pessoa: user.tipo_pessoa || ""
        });
    }, []);

    return (
        <main className="content MeusDados">
            <section className='titulo-secao'>
                <h1><i className={icons.clientePerson}></i> Meu Perfil</h1>
            </section>            
            <div className="perfil">
                <i className="bi bi-person-circle"></i>
                <h2>{userData.social_name}</h2>
            </div>

             <section className="form-section">
                <hr/>

                <div className="form-row">
                    <div className="form-group">
                        <label>Nome: </label>
                        <input
                            type="text"
                            value={userData.social_name}
                            disabled={!editando}
                            onChange={(e) =>
                                setUserData({ ...userData, social_name: e.target.value })
                            }
                        />

                    </div>
                    <div className="form-group">
                        <label>E-mail: </label>
                        <input type="text" value={userData.email} disabled={!editando}
                            onChange={(e) =>
                                setUserData({ ...userData, email: e.target.value })
                            } 
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>CNPJ/CPF: </label>
                        <input type="text" value={userData.cpf_cnpj} disabled={!editando}
                            onChange={(e) =>
                                setUserData({ ...userData, cpf_cnpj: e.target.value })
                            } 
                        />
                    </div>
                    <div className="form-group">
                        <label>Telefone: </label>
                        <input type="text" value={userData.telefone} disabled={!editando}
                            onChange={(e) =>
                                setUserData({ ...userData, telefone: e.target.value })
                            } 
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Tipo de Pessoa: </label>
                        <input type="text" value={userData.tipo_pessoa} disabled={!editando}
                            onChange={(e) =>
                                setUserData({ ...userData, tipo_pessoa: e.target.value })
                            } 
                        />
                    </div>
                </div>
            
                <div className="botao_geral">
                    {!editando ? (
                        <button
                        type="button"
                        onClick={() => {
                            setBackupData(userData);
                            setEditando(true);
                        }}
                        >
                        Editar
                        </button>
                    ) : (
                        <>
                        <button
                            type="button"
                            onClick={() => {
                            localStorage.setItem("user", JSON.stringify(userData));
                            setEditando(false);
                            }}
                        >
                            Salvar Alterações
                        </button>

                        <button
                            type="button"
                            className="btn-vermelho"
                            onClick={() => {
                            setUserData(backupData);
                            setEditando(false);
                            }}
                        >
                            Cancelar
                        </button>
                        </>
                    )}
                </div>
            </section>
        </main> 
    );
}

export default MeusDados;