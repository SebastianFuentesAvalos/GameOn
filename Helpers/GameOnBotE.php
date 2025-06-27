<?php

class GameOnBot
{
    private string $secret;
    private string $userId;
    private string $botId; // Nuevo: ID del bot Chatbase

    /**
     * Constructor.
     * @param string $secret  Clave secreta de Chatbase
     * @param string $userId  ID único de usuario (por ejemplo, $_SESSION['user_id'])
     * @param string $botId   ID único del bot Chatbase (del script embed)
     */
    public function __construct(string $secret, string $userId, string $botId)
    {
        $this->secret = $secret;
        $this->userId = $userId;
        $this->botId  = $botId;
    }

    /**
     * Genera un hash HMAC SHA256 para el usuario.
     * @return string
     */
    public function generateUserHash(): string
    {
        return hash_hmac('sha256', $this->userId, $this->secret);
    }

    /**
     * Devuelve el código para incrustar el bot en la web.
     * Incluye el hash del usuario y el userId, útil si Chatbase lo requiere para personalización.
     * @return string
     */
    public function getEmbedScript(): string
    {
        $userHash = $this->generateUserHash();
        $userId = htmlspecialchars($this->userId, ENT_QUOTES, 'UTF-8');
        $botId = htmlspecialchars($this->botId, ENT_QUOTES, 'UTF-8');

        return <<<HTML
<!-- Chatbase GameOnBot Integration -->
<script>
(function(){
    // Definir variables globales para Chatbase si personalización está activa
    window.chatbaseUserHash = "$userHash";
    window.chatbaseUserId = "$userId";
    if(!window.chatbase||window.chatbase("getState")!=="initialized"){
        window.chatbase=(...arguments)=>{
            if(!window.chatbase.q){window.chatbase.q=[]}
            window.chatbase.q.push(arguments)
        };
        window.chatbase=new Proxy(window.chatbase,{
            get(target,prop){
                if(prop==="q"){return target.q}
                return(...args)=>target(prop,...args)
            }
        })
    }
    const onLoad=function(){
        const script=document.createElement("script");
        script.src="https://www.chatbase.co/embed.min.js";
        script.id="$botId";
        script.domain="www.chatbase.co";
        document.body.appendChild(script)
    };
    if(document.readyState==="complete"){
        onLoad()
    }else{
        window.addEventListener("load",onLoad)
    }
})();
</script>
<style>
/* Ajusta la posición del widget si es necesario */
#chatbase-bot {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
}
</style>
HTML;
    }
}
?>