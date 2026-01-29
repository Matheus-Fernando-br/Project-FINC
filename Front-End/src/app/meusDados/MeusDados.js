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
        tipo_pessoa: "",
        cep: "",
        uf: "",
        cidade: "",
        logradouro: "",
        numero: "",
        complemento: ""
    });

    const [backupData, setBackupData] = useState(null);


    const [senha, setSenha] = useState("");
    const [repetirSenha, setRepetirSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);


    useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserData({
        social_name: user.social_name || "",
        email: user.email || "",
        cpf_cnpj: user.cpf_cnpj || "",
        telefone: user.telefone || "",
        tipo_pessoa: user.tipo_pessoa || "",
        cep: user.cep || "",
        uf: user.uf || "",
        cidade: user.cidade || "",
        logradouro: user.logradouro || "",
        numero: user.numero || "",
        complemento: user.complemento || ""
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
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>E-mail: </label>
                        <input type="text" value={userData.email} disabled={!editando}
                            onChange={(e) =>
                                setUserData({ ...userData, email: e.target.value })
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
                        <label>Tipo de Pessoa</label>

                        {editando ? (
                        <select
                            value={userData.tipo_pessoa}
                            onChange={(e) =>
                            setUserData({ ...userData, tipo_pessoa: e.target.value, cpf_cnpj: "" })
                            }
                        >
                            <option value="">Selecione</option>
                            <option value="PFisica">Pessoa Física</option>
                            <option value="PJuridica">Pessoa Jurídica</option>
                        </select>
                        ) : (
                        <input value={userData.tipo_pessoa} disabled />
                        )}
                    </div>

                    <div className="form-group">
                        <label>{userData.tipo_pessoa === "PJuridica" ? "CNPJ" : "CPF"}</label>
                        <input
                        type="text"
                        value={userData.cpf_cnpj}
                        disabled={!editando}
                        onChange={(e) =>
                            setUserData({ ...userData, cpf_cnpj: e.target.value })
                        }
                        />
                    </div>
                </div>
                {editando && (
                    <div className="form-row">
                        <div className="form-group">
                        <label>Nova Senha</label>
                        <div className="input-senha">
                            <input
                            type={mostrarSenha ? "text" : "password"}
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            />
                            <i
                            className={`bi ${mostrarSenha ? "bi-eye-slash" : "bi-eye"}`}
                            onClick={() => setMostrarSenha(!mostrarSenha)}
                            />
                        </div>
                        </div>

                        <div className="form-group">
                        <label>Repita a Senha</label>
                        <input
                            type={mostrarSenha ? "text" : "password"}
                            value={repetirSenha}
                            onChange={(e) => setRepetirSenha(e.target.value)}
                        />
                        </div>
                    </div>
                )}

                <div className="form-row">
                    <div className="form-group">
                        <label>CEP</label>
                        <input value={userData.cep} disabled={!editando}
                        onChange={e => setUserData({...userData, cep: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>UF</label>
                        <input value={userData.uf} disabled={!editando}
                        onChange={e => setUserData({...userData, uf: e.target.value})}
                        />
                    </div>
                    </div>

                    <div className="form-row">
                    <div className="form-group">
                        <label>Cidade</label>
                        <input value={userData.cidade} disabled={!editando}
                        onChange={e => setUserData({...userData, cidade: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Logradouro</label>
                        <input value={userData.logradouro} disabled={!editando}
                        onChange={e => setUserData({...userData, logradouro: e.target.value})}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Número:</label>
                        <input
                        type="text"
                        value={userData.numero}
                        disabled={!editando}
                        onChange={(e) =>
                            setUserData({ ...userData, numero: e.target.value })
                        }
                        />
                    </div>

                    <div className="form-group">
                        <label>Complemento:</label>
                        <input
                        type="text"
                        value={userData.complemento}
                        disabled={!editando}
                        onChange={(e) =>
                            setUserData({ ...userData, complemento: e.target.value })
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
                            onClick={async () => {
                                await fetch("https://project-finc.onrender.com/api/profile", {
                                method: "PUT",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${localStorage.getItem("token")}`
                                },
                                body: JSON.stringify(userData)
                                });

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

                            if (backupData) {
                                setUserData(backupData);
                            }
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